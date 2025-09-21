import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faTimes,
  faImage,
  faEllipsisV,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../firebase";
import { doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import "./AdminFoundItem.css";

function AdminFoundItem({ item, type }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(item.text || "");
  const [isExpanded, setIsExpanded] = useState(false);

  const menuRef = useRef(null);

  const itemRef = doc(
    db,
    "schools",
    item.school,
    type === "found" ? "FoundItems" : "LostItems",
    item.id
  );

  const timeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 5) return "Just now";          // 👈 New line
  if (seconds < 60)  return "Just now"; 
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
  
  // --- Display ---
  const claimedClass = item.claimed ? "claimed" : "unclaimed";
  const claimedText = item.claimed ? "Claimed" : "Unclaimed";

  const maxPreviewLength = 100;
  const isLongText = item.text.length > maxPreviewLength;
  const displayedText =
    isExpanded || !isLongText
      ? item.text
      : item.text.slice(0, maxPreviewLength);

  if (!item) return null;

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

          </div>
          <div className="admin-card-menu" ref={menuRef}>
            <button
              className="ellipsis-btn"
              onClick={() => setShowMenu((prev) => !prev)}
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
      {showEditModal && (
        <div className="modal-overlay">
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

      {showDeleteModal && (
        <div className="modal-overlay">
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
