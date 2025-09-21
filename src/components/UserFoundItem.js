import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faImage } from '@fortawesome/free-solid-svg-icons';
import './AdminFoundItem.css';

function UserFoundItem({ item }) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!item) return null;

  const claimedClass = item.claimed ? 'claimed' : 'unclaimed';
  const claimedText = item.claimed ? 'Claimed' : 'Unclaimed';

  const maxPreviewLength = 100;
  const isLongText = item.text.length > maxPreviewLength;
  const displayedText = isExpanded ? item.text : item.text.slice(0, maxPreviewLength);

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


  return (
    <>
      <div className={`item-card admin-item-card ${claimedClass}`}>
        {/* Top Row: Author, Time */}
        <div className="admin-card-top-row">
          <div>
            <div className="admin-card-author">{item.authorName || "Unknown"}</div>
            {item.createdAt && (
              <div className="admin-card-time">{timeAgo(item.createdAt)}</div>
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
    </>
  );
}

export default UserFoundItem;