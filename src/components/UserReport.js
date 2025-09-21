
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';

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
  reportMessage,
  setReportMessage,
  onCancel,
  onSubmit,
  isSubmittingReport,
  selectedReason,
  setSelectedReason,
}) => {
  const handleReasonSelect = (key) => {
    setSelectedReason(key);
    if (key !== 'other') setReportMessage(REPORT_REASONS.find(r => r.key === key).label);
    else setReportMessage('');
  };

  if (!show) return null;

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
            onClick={() => onSubmit(postId)}
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