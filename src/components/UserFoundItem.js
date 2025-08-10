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
      <div className={`user-item-card ${claimedClass}`}>
        <div className="user-item-content">
          <p className="user-item-text">
            {displayedText}
            {isLongText && (
              <span
                className="see-more-text"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? ' See less' : '... See more'}
              </span>
            )}
          </p>

          <div className="user-item-status">
            <FontAwesomeIcon
              icon={item.claimed ? faCheckCircle : faTimesCircle}
              className={`user-status-icon ${claimedClass}`}
            />
            <span className="user-status-text">{claimedText}</span>
          </div>

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
