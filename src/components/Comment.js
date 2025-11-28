import React, { useState, useRef, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import './Comment.css';

const MAX_COMMENT_LENGTH = 500;
const PREVIEW_LENGTH = 80;

const Comment = ({
  post,
  user,
  verificationStatus,
  commentsRef,
  timeAgo,
  displayErrorModal,
  schoolName
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState([]);
  const [role, setRole] = useState('');

  const submittingRef = useRef(false);

  useEffect(() => {
    const commentsRefCollection = collection(db, 'schools', schoolName, 'LostItems', post.id, 'comments');
    const q = query(commentsRefCollection, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => doc.data()));
      // Scroll to bottom when new comment arrives
      if (commentsRef && commentsRef.current && commentsRef.current[post.id]) {
        const ref = commentsRef.current[post.id];
        ref.scrollTop = ref.scrollHeight;
      }
    });
    return () => unsubscribe();
  }, [schoolName, post.id, commentsRef]);

  // Fetch role for current user so admins can bypass verification
  useEffect(() => {
    if (!user || !schoolName) {
      setRole('');
      return;
    }

    let cancelled = false;
    const fetchRole = async () => {
      try {
        const userDocRef = doc(db, 'schools', schoolName, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (!cancelled) {
          setRole(docSnap.exists() ? (docSnap.data()?.role || '') : '');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        if (!cancelled) setRole('');
      }
    };

    fetchRole();
    return () => { cancelled = true; };
  }, [user, schoolName]);

  const handleAddComment = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const text = commentText.trim();
    if (!text) {
      displayErrorModal("Error", "Comment cannot be empty.");
      submittingRef.current = false;
      return;
    }
    if (!user) {
      displayErrorModal("Error", "You must be logged in to comment.");
      submittingRef.current = false;
      return;
    }

    const isAdmin = role === 'admin' || role === 'main-admin' || role === 'super-admin';

    // Double-check on submit: only allow if verified OR admin
    if (verificationStatus !== 'verified' && !isAdmin) {
      displayErrorModal("Error", "You must be verified to comment. Please complete verification in your profile.");
      submittingRef.current = false;
      return;
    }

    setIsSubmitting(true);
    const authorName = isAnonymous ? 'Anonymous' : (user?.displayName || 'Anonymous');

    const newComment = {
      text,
      author: authorName,
      authorId: user.uid,
      isAnonymous,
    };

    try {
      const commentsCollectionRef = collection(db, 'schools', schoolName, 'LostItems', post.id, 'comments');
      await addDoc(commentsCollectionRef, {
        ...newComment,
        timestamp: Timestamp.now(),
      });
      setCommentText('');
      setIsAnonymous(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      displayErrorModal("Error", "Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const toggleExpand = (index) => {
    setExpandedComments(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const isAdmin = role === 'admin' || role === 'main-admin' || role === 'super-admin';

  return (
    <div className="ui-comment-section">
      <div ref={el => { if (commentsRef && commentsRef.current) commentsRef.current[post.id] = el; }} className="ui-comments-container">
        {comments.length > 0 ? (
          comments.map((comment, index) => {
            const isLong = comment.text.length > PREVIEW_LENGTH;
            const isExpanded = expandedComments[index];
            const displayText = isLong && !isExpanded
              ? comment.text.slice(0, PREVIEW_LENGTH) + '...'
              : comment.text;
            return (
              <div key={index} className="ui-comment">
                <div className="ui-comment-author">
                  <span className="ui-comment-author-name">
                    {comment.author}
                    {comment.isAnonymous && user && comment.authorId === user.uid && (
                      <span className="ui-my-anonymous-badge" title="This is your anonymous comment">
                        <FontAwesomeIcon icon={faUser} />
                      </span>
                    )}
                    <p className="ui-comment-time">{comment.timestamp ? timeAgo(comment.timestamp) : 'Just now'}</p>
                  </span>
                </div>
                <p className="ui-comment-text">
                  {displayText}
                  {isLong && (
                    <span
                      className="see-more-text"
                      style={{ color: "#1877f2", cursor: "pointer", marginLeft: 4, fontWeight: 450 }}
                      onClick={() => toggleExpand(index)}
                    >
                      {isExpanded ? " See less" : " See more"}
                    </span>
                  )}
                </p>
              </div>
            );
          })
        ) : (
          <p className="ui-empty-comments">No comments yet. Be the first to comment!</p>
        )}
      </div>

      {!user ? (
        <p className="ui-login-to-comment-message">Log in to add a comment.</p>
      ) : (verificationStatus !== 'verified' && !isAdmin) ? (
        <div className="ui-verify-warning">
          <p>You must be verified to comment. Please complete verification in your profile.</p>
        </div>
      ) : (
        <div className="ui-comment-form">
          <div className="ui-comment-input-wrapper">
            <textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => {
                const value = e.target.value;
                if (value.length <= MAX_COMMENT_LENGTH) {
                  setCommentText(value);
                } else {
                  setCommentText(value.slice(0, MAX_COMMENT_LENGTH));
                }
              }}
              maxLength={MAX_COMMENT_LENGTH}
              className="ui-comment-textarea"
              rows="2"
              disabled={isSubmitting}
            />
          </div>
          {commentText.length === MAX_COMMENT_LENGTH && (
            <div className="ui-comment-warning">
              The text reached the limit.
            </div>
          )}
          <div className="ui-comment-actions">
            <label className="ui-anonymous-toggle">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
              />
              <span>Anonymous</span>
            </label>
            <button
              onClick={handleAddComment}
              className="ui-post-btn"
              disabled={isSubmitting || !commentText.trim()}
            >
              {isSubmitting ? 'Sending...' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comment;