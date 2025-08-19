import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faTimes, faImage } from '@fortawesome/free-solid-svg-icons';
import './UserFoundItem.css';

function UserFoundItem({ item }) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!item) return null;

  const claimedClass = item.claimed ? 'claimed' : 'unclaimed';
  const claimedText = item.claimed ? 'Claimed' : 'Unclaimed';

  const maxPreviewLength = 100;
  const isLongText = item.text.length > maxPreviewLength;
  const displayedText = isExpanded ? item.text : item.text.slice(0, maxPreviewLength);

  return (
    <>
      <div className={`item-card admin-item-card ${claimedClass}`}>
              {/* Admin Header (Always shown now) */}
              <div className="admin-item-header">
                <div className="admin-item-status">
                  <FontAwesomeIcon
                    icon={item.claimed ? faCheckCircle : faTimesCircle}
                    className={`admin-status-icon ${claimedClass}`}
                  />
                  <span className="admin-status-text">{claimedText}</span>
                </div>
              </div>
      
              {/* --- Shared Content --- */}
              <div className="user-item-content">
                <p className="user-item-text">
                  {displayedText}
                  {isLongText && (
                    <span
                      className="see-more-text"
                      onClick={() => setIsExpanded((prev) => !prev)}
                    >
                      {isExpanded ? " See less" : "... See more"}
                    </span>
                  )}
                </p>
      
                {/* Image button */}
                {item.imageUrl && (
                  <button
                    className="see-photo-btn"
                    onClick={() => setShowImageModal(true)}
                  >
                    <FontAwesomeIcon icon={faImage} /> See Photo
                  </button>
                )}
              </div>
            </div>

      {showImageModal && item.imageUrl && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowImageModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img
              src={item.imageUrl}
              alt={item.text}
              className="modal-image"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default UserFoundItem;
