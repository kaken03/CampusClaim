import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faTimes,
  faImage,
  faEllipsisV,
  faEdit,
  faBan,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../config/firebase";
import { doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./AdminFoundItem.css";

function AdminFoundItem({ item, type }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(item?.text || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const menuRef = useRef(null);
  const auth = getAuth();

  const itemRef = doc(
    db,
    "schools",
    item?.school || "",
    type === "found" ? "FoundItems" : "LostItems",
    item?.id || ""
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, [auth]);

  const timeAgo = (timestamp) => {
    if (!timestamp) return "";
    // normalize Firestore Timestamp or object with seconds to a Date
    let date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp === "object" && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 5) return "Just now";
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Actions ---
  const handleDelete = async () => {
    try {
      await deleteDoc(itemRef);
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleClaimedToggle = async () => {
    try {
      await updateDoc(itemRef, { claimed: !item.claimed });
    } catch (error) {
      console.error("Error updating claimed status:", error);
    }
    setShowMenu(false);
  };

  const handleEditSave = async () => {
    try {
      await updateDoc(itemRef, { text: editText });
    } catch (error) {
      console.error("Error updating item:", error);
    }
    setShowEditModal(false);
  };

  // if item is not provided, don't render (hooks have already been declared)
  if (!item) return null;

  // Determine whether current user is the author of this post
  const isAuthor = currentUser && item.authorId === currentUser.uid;

  // =========================================================================
  // >>> MODIFICATION HERE: Implement the blocked post visibility rule
  // =========================================================================
  if (item.isBlocked && !isAuthor) {
    return null; // Don't render the post if it's blocked AND the user is not the author
  }
  // =========================================================================
  // >>> END MODIFICATION
  // =========================================================================

  // --- Display ---
  const claimedClass = item.claimed ? "claimed" : "unclaimed";
  const claimedText = item.claimed ? "Claimed" : "Unclaimed";

  const maxPreviewLength = 100;
  const isLongText = (item.text || "").length > maxPreviewLength;
  const displayedText =
    isExpanded || !isLongText ? (item.text || "") : (item.text || "").slice(0, maxPreviewLength);

  return (
    <>
      <div className={`item-card admin-item-card ${claimedClass}`}>
        {/* Top Row: Author, Time, Menu */}
        <div className="admin-card-top-row">
          <div>
            <div className="admin-card-author">{item.authorName || "Unknown"}</div>
            {item.createdAt && (
              <div className="admin-card-time">{timeAgo(item.createdAt)}</div>
            )}
            {item.isBlocked && (
              <div className="ui-blocked-warning">
                <FontAwesomeIcon icon={faBan} /> This post is blocked by the admin.
              </div>
            )}
          </div>

          {/* Only the original author may see/use the ellipsis/menu and actions */}
          {isAuthor && (
            <div className="admin-card-menu" ref={menuRef}>
              <button
                className="ellipsis-btn"
                onClick={() => setShowMenu((prev) => !prev)}
                aria-label="Open post menu"
              >
                <FontAwesomeIcon icon={faEllipsisV} />
              </button>
              {showMenu && (
                <div className="menu-dropdown">
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setShowMenu(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowMenu(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button>
                  <button onClick={handleClaimedToggle}>
                    {item.claimed ? "Mark Unclaimed" : "Mark Claimed"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <hr className="admin-card-divider" />

        {/* Status and Category */}
        <div className="admin-card-status-category">
          <span className={`admin-status-text ${claimedClass}`}>
            {claimedText}
          </span>
          <span className="admin-card-category">
            {item.category ? `(${item.category})` : "(Uncategorized)"}
          </span>
        </div>

        {/* Description */}
        {item.text && (
          <div className="admin-card-description">
            {displayedText}
            {isLongText && (
              <span
                className="see-more-text"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                {isExpanded ? " See less" : "... See more"}
              </span>
            )}
          </div>
        )}

        {/* See Photo Button */}
        {item.imageUrl && (
          <button
            className="admin-card-photo-btn"
            onClick={() => setShowImageModal(true)}
          >
            <FontAwesomeIcon icon={faImage} /> See Photo
          </button>
        )}
      </div>

      {/* --- Modals --- */}
      {showEditModal && isAuthor && (
        <div className="ui-modal-overlay">
          <div className="modal-content-edit">
            <h3>Edit Post</h3>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows="4"
            />
            <div className="modal-buttons">
              <button
                className="modal-btn modal-btn-confirm"
                onClick={handleEditSave}
              >
                Save
              </button>
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageModal && item.imageUrl && (
        <div className="ui-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="ui-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setShowImageModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <img src={item.imageUrl} alt={item.text} className="modal-image" />
          </div>
        </div>
      )}

      {showDeleteModal && isAuthor && (
        <div className="ui-modal-overlay">
          <div className="modal-content-delete">
            <p>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
            <div className="modal-buttons">
              <button
                className="modal-btn modal-btn-confirm"
                onClick={handleDelete}
              >
                Delete
              </button>
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminFoundItem;