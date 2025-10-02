import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const REPORT_REASONS = [
  {
    key: 'spam',
    label: 'Spam',
    description: 'Unwanted or repetitive content, advertisements, or irrelevant posts.',
  },
  {
    key: 'scam',
    label: 'Scam or Fraud',
    description: 'Attempts to deceive, scam, or defraud users.',
  },
  {
    key: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Offensive, abusive, or inappropriate language or images.',
  },
  {
    key: 'misleading',
    label: 'Misleading Information',
    description: 'False or misleading claims about lost/found items.',
  },
];

const UserReport = ({
  show,
  postId,
  onCancel,
  onSubmit,
  isSubmittingReport,
  user, // add this
  schoolName, // add this
  displayErrorModal, // add this
  setShowReportModalId, // add this
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [alreadyReported] = useState(false);

  useEffect(() => {
    if (show) {
      setSelectedReason('');
      setReportMessage('');
    }
  }, [show]);



  const handleReasonSelect = (key) => {
    setSelectedReason(key);
    if (key !== 'other') setReportMessage(REPORT_REASONS.find(r => r.key === key).label);
    else setReportMessage('');
  };

  const confirmReport = async () => {
    if (!user) {
      displayErrorModal("Permission Denied", "You must be logged in to report a post.");
      return;
    }
    if (!reportMessage.trim()) {
      displayErrorModal("Error", "Please provide a reason for the report.");
      return;
    }

    // Check if user already reported this post
    const reportRef = collection(db, 'schools', schoolName, 'LostItems', postId, 'reports');
    const q = query(reportRef, where('reporterId', '==', user.uid));
    const existingReports = await getDocs(q);

    if (!existingReports.empty) {
  displayErrorModal("Error", "You have already reported this post.");
  setShowReportModalId(null); // Close the modal
  return;
}

    await addDoc(reportRef, {
      reporterId: user.uid,
      reason: reportMessage,
      createdAt: Timestamp.now(),
    });
    displayErrorModal("Success", "Post reported successfully. An admin will review it shortly.");
    setShowReportModalId(null);
    setReportMessage('');
  };

  if (!show || alreadyReported) return null;

  return (
    <div className="ui-modal-overlay">
      <div className="ui-modal-content ui-report-modal">
        <div className="ui-modal-header">
          <h4 className="ui-modal-title">Report Post</h4>
          {onCancel && (
            <button onClick={onCancel} className="ui-modal-close-btn">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        <p className="ui-modal-message" style={{ marginBottom: 16, fontWeight: 500 }}>
          Select your report reason:
        </p>
        <div className="ui-report-reason-list">
          {REPORT_REASONS.map(reason => (
            <div
              key={reason.key}
              className={`ui-report-reason-item${selectedReason === reason.key ? ' selected' : ''}`}
              onClick={() => handleReasonSelect(reason.key)}
            >
              <FontAwesomeIcon
                icon={selectedReason === reason.key ? faCheckSquare : faSquare}
                className="ui-report-checkbox"
              />
              <div>
                <span className="ui-report-reason-label">{reason.label}</span>
                <span className="ui-report-reason-desc">{reason.description}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="ui-modal-actions">
          <button onClick={onCancel} className="ui-btn ui-btn-secondary">Cancel</button>
          <button
            onClick={confirmReport}
            className="ui-btn ui-btn-primary"
            disabled={isSubmittingReport || (!reportMessage && selectedReason === 'other')}
          >
            {isSubmittingReport ? 'Submitting...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserReport;