import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faTrash, faTimes, faImage, faEllipsisV, faEdit } from '@fortawesome/free-solid-svg-icons';
import { db } from '../firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import './AdminFoundItem.css';

function AdminFoundLostItem({ item, type }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(item.text || "");

  const menuRef = useRef(null);

  const itemRef = doc(
    db,
    'schools',
    item.school,
    `${type === 'found' ? 'FoundItems' : 'LostItems'}`,
    item.id
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    try {
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleClaimedToggle = async () => {
    try {
      await updateDoc(itemRef, { claimed: !item.claimed });
    } catch (error) {
      console.error('Error updating claimed status:', error);
    }
    setShowMenu(false);
  };

  const handleEditSave = async () => {
    try {
      await updateDoc(itemRef, { text: editText });
    } catch (error) {
      console.error('Error updating post:', error);
    }
    setShowEditModal(false);
  };

  const claimedClass = item.claimed ? 'claimed' : 'unclaimed';
  const claimedText = item.claimed ? 'Claimed' : 'Unclaimed';

  return (
    <>
      <div className={`admin-item-card ${claimedClass}`}>
        {/* Header with status and menu */}
        <div className="admin-item-header">
          <div className="admin-item-status">
            <FontAwesomeIcon
              icon={item.claimed ? faCheckCircle : faTimesCircle}
              className={`admin-status-icon ${claimedClass}`}
            />
            <span className="admin-status-text">{claimedText}</span>
          </div>
          <div className="menu-wrapper" ref={menuRef}>
            <button
              className="ellipsis-btn"
              onClick={() => setShowMenu((prev) => !prev)}
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            {showMenu && (
              <div className="menu-dropdown">
                <button onClick={() => { setShowEditModal(true); setShowMenu(false); }}>
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
                <button onClick={() => setShowDeleteModal(true)}>
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
                <button onClick={handleClaimedToggle}>
                  {item.claimed ? 'Mark Unclaimed' : 'Mark Claimed'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post content */}
        <p className="admin-item-text">{item.text}</p>

        {item.imageUrl && (
          <button
            className="see-photo-btn"
            onClick={() => setShowImageModal(true)}
          >
            <FontAwesomeIcon icon={faImage} /> See Photo
          </button>
        )}
      </div>

      {/* Edit Modal */}
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
              <button className="modal-btn modal-btn-confirm" onClick={handleEditSave}>
                Save
              </button>
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && item.imageUrl && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowImageModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={item.imageUrl} alt={item.text} className="modal-image" />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content-delete">
            <p className="modal-message">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button
                onClick={handleDelete}
                className="modal-btn modal-btn-confirm"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="modal-btn modal-btn-cancel"
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

export default AdminFoundLostItem;
