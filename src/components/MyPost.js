import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, Timestamp, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import './MyPost.css';

function MyPost({ schoolName }) {
  const [posts, setPosts] = useState([]);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [currentEditedText, setCurrentEditedText] = useState('');
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState({});
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  const [filter, setFilter] = useState('all');

  // State: To control which post's comment section is open
  const [openCommentPostId, setOpenCommentPostId] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();
  const commentsRef = useRef({});
  const submittingCommentRef = useRef({});

  // Utility function to calculate "time ago"
  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  // Effect to handle URL parameters for direct post links
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postId = params.get('postId');
    if (postId) {
      setHighlightedPostId(postId);
      setOpenCommentPostId(postId); // Automatically open comments if specific post is highlighted
    }
  }, [location]);

  // Effect to fetch user's Lost Items posts from Firestore
  useEffect(() => {
    if (!user) {
      setPosts([]);
      return;
    }

    const qLostItems = query(
      collection(db, 'schools', schoolName, 'LostItems'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(qLostItems, (snapshot) => {
      const lostPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // No need for _type or _collection as it's implicitly 'lost' and 'LostItems'
      }));
      setPosts(lostPosts);
    });

    return () => unsub(); // Cleanup subscription
  }, [user, schoolName]);

  // Effect to scroll to and highlight a post if a postId is in the URL
  useEffect(() => {
    if (highlightedPostId && posts.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(highlightedPostId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Small delay to ensure rendering
    }
  }, [highlightedPostId, posts]);

  // Effect to scroll to bottom of comments when comments update for an open section
  useEffect(() => {
    if (openCommentPostId && commentsRef.current[openCommentPostId]) {
      const ref = commentsRef.current[openCommentPostId];
      ref.scrollTop = ref.scrollHeight;
    }
  }, [posts, openCommentPostId]);

  // --- User's Own Post Edit Functions ---
  const handleUserStartEdit = (post) => {
    setEditingPostId(post.id);
    setCurrentEditedText(post.text);
  };

  const handleUserCancelEdit = () => {
    setEditingPostId(null);
    setCurrentEditedText('');
  };

  const handleUserSaveEdit = async (postId) => {
    if (currentEditedText.trim() === '') {
      alert('Post text cannot be empty.');
      return;
    }
    try {
      await updateDoc(doc(db, 'schools', schoolName, 'LostItems', postId), { text: currentEditedText.trim() });
      alert('Post updated successfully!');
      handleUserCancelEdit(); // Exit edit mode
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  // --- User's Own Post Delete Functions ---
  const handleUserStartDelete = (postId) => {
    setDeletingPostId(postId);
  };

  const handleUserCancelDelete = () => {
    setDeletingPostId(null);
  };

  const handleUserConfirmDelete = async (postId) => {
    try {
      await deleteDoc(doc(db, 'schools', schoolName, 'LostItems', postId));
      alert('Post deleted successfully!');
      handleUserCancelDelete(); // Exit delete confirmation mode
      // Close comment section if deleted post was open
      if (openCommentPostId === postId) {
        setOpenCommentPostId(null);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };
  // --- END USER POST FUNCTIONS ---

  const handleCommentChange = (postId, text) => {
    setCommentTexts((prev) => ({
      ...prev,
      [postId]: text,
    }));
  };

  const handleAddComment = async (postId) => {
    // Prevent double submission
    if (submittingCommentRef.current[postId]) {
      console.log(`[Local Guard] Comment for post ${postId} is already being submitted. Ignoring duplicate click.`);
      return;
    }
    submittingCommentRef.current[postId] = true; // Set guard

    const commentText = commentTexts[postId]?.trim();

    if (!commentText) {
      alert('Comment cannot be empty.');
      submittingCommentRef.current[postId] = false; // Release guard
      return;
    }
    if (!user) {
      alert('You must be logged in to comment.');
      submittingCommentRef.current[postId] = false; // Release guard
      return;
    }

    setIsSubmittingComment(prev => ({ ...prev, [postId]: true })); // Show loading state on button

    const postRef = doc(db, 'schools', schoolName, 'LostItems', postId);

    const commentAuthorName = isAnonymousComment ? 'Anonymous User' : (user?.displayName || 'Anonymous User');

    // Find the post to get its current comments
    const postToUpdate = posts.find(p => p.id === postId);
    const updatedComments = [...(postToUpdate?.comments || []), {
      text: commentText,
      author: commentAuthorName,
      authorId: user.uid,
      isAnonymous: isAnonymousComment,
      timestamp: Timestamp.now(),
    }];

    try {
      await updateDoc(postRef, { comments: updatedComments });
      setCommentTexts((prev) => ({
        ...prev,
        [postId]: '',
      }));
      setIsAnonymousComment(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: false }));
      submittingCommentRef.current[postId] = false; // Release guard
    }
  };

  // Toggle comments visibility for a specific post
  const toggleComments = (postId) => {
    setOpenCommentPostId(prevId => prevId === postId ? null : postId);
  };

  const handleMarkAsClaimed = async (postId) => {
    if (window.confirm('Are you sure you want to mark this item as CLAIMED?')) {
      try {
        const postRef = doc(db, 'schools', schoolName, 'LostItems', postId);
        await updateDoc(postRef, { claimed: true });
        alert('Post marked as claimed!');
      } catch (error) {
        console.error('Error marking as claimed:', error);
        alert('Failed to mark as claimed. Please try again.');
      }
    }
  };

  const handleUnmarkAsClaimed = async (postId) => {
    if (window.confirm('Are you sure you want to UNMARK this item as CLAIMED?')) {
      try {
        const postRef = doc(db, 'schools', schoolName, 'LostItems', postId);
        await updateDoc(postRef, { claimed: false });
        alert('Post unmarked as claimed!');
      } catch (error) {
        console.error('Error unmarking as claimed:', error);
        alert('Failed to unmark as claimed. Please try again.');
      }
    }
  };

  // Filtered posts based on the selected filter (all, claimed, unclaimed)
  const filteredPosts = posts.filter((post) => {
    if (filter === 'claimed') return post.claimed;
    if (filter === 'unclaimed') return !post.claimed;
    return true;
  });

  return (
    <div className="mp-feed">
      <h2 className="mp-title">My Lost Items</h2>

      <div className="mp-filter-selector">
        <span className="mp-filter-label">Filter:</span>
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'mp-filter-btn mp-filter-btn-active mp-bg-default' : 'mp-filter-btn'}
        >
          All
        </button>
        <button
          onClick={() => setFilter('claimed')}
          className={filter === 'claimed' ? 'mp-filter-btn mp-filter-btn-active mp-bg-green' : 'mp-filter-btn'}
        >
          Claimed
        </button>
        <button
          onClick={() => setFilter('unclaimed')}
          className={filter === 'unclaimed' ? 'mp-filter-btn mp-filter-btn-active mp-bg-red' : 'mp-filter-btn'}
        >
          Unclaimed
        </button>
      </div>

      {filteredPosts.length === 0 ? (
        <p className="mp-no-posts">You haven't posted any lost items yet.</p>
      ) : (
        filteredPosts.map((post) => (
          <div
            key={post.id}
            id={post.id}
            className={`mp-post-card mp-border-red ${post.id === highlightedPostId ? 'mp-highlighted' : ''} ${post.claimed ? 'mp-claimed-post' : ''}`}
          >
            <div className="mp-card-header">
                <p className="mp-author">
                    <strong>{post.authorName}</strong>
                </p>
                {/* No _type badge needed as all are Lost Items */}
                {/* Anonymous badge, conditional on post being anonymous */}
                {post.isAnonymous && (
                    <span className="mp-anon-badge">
                        <span role="img" aria-label="anonymous">🕵️</span> Anonymous
                    </span>
                )}
                {/* Claimed indicator */}
                {post.claimed && (
                    <span className="mp-claimed-indicator">
                        <span role="img" aria-label="claimed">✅</span> Claimed
                    </span>
                )}
                <p className="mp-date">{post.createdAt ? timeAgo(post.createdAt) : '...'}</p>
            </div>

            {/* Post Image */}
            {post.imageUrl && (
                <div className="mp-image-container">
                    <img src={post.imageUrl} alt="Post" className="mp-image" />
                </div>
            )}

            {/* Blocked post message for author */}
            {post.isBlocked ? (
              <div className="mp-admin-blocked-section">
                <div className="mp-blocked-message">
                  <span role="img" aria-label="blocked">🚫</span> This post is blocked by the admin. Only you can see this post.
                </div>
                <div className="mp-blocked-actions">
                  <button
                    onClick={() => handleUserConfirmDelete(post.id)} // Removed _collection arg
                    className="mp-btn mp-delete-anyway-btn"
                  >
                    Delete Blocked Post
                  </button>
                </div>
              </div>
            ) : (
              // Regular post content (editable or display)
              editingPostId === post.id ? (
                  <textarea
                      className="mp-edit-textarea"
                      value={currentEditedText}
                      onChange={(e) => setCurrentEditedText(e.target.value)}
                      rows="5"
                  />
              ) : (
                  <p className="mp-text">{post.text}</p>
              )
            )}

            {/* Action buttons section */}
            <div className="mp-post-footer-actions">
                {/* User's Own Post Actions (Edit/Delete/Claim) - Always applicable for MyPost */}
                <div className="mp-user-actions-row">
                    {editingPostId === post.id ? (
                        <>
                            <button onClick={() => handleUserSaveEdit(post.id)} className="mp-btn mp-save-btn">Save</button> {/* Removed _collection arg */}
                            <button onClick={handleUserCancelEdit} className="mp-btn mp-cancel-btn">Cancel</button>
                        </>
                    ) : deletingPostId === post.id ? (
                        <>
                            <button onClick={handleUserCancelDelete} className="mp-btn mp-cancel-btn">Cancel</button>
                            <button onClick={() => handleUserConfirmDelete(post.id)} className="mp-btn mp-delete-anyway-btn">Delete Anyway</button> {/* Removed _collection arg */}
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleUserStartEdit(post)} className="mp-btn mp-edit-btn">Edit</button>
                            <button onClick={() => handleUserStartDelete(post.id)} className="mp-btn mp-delete-btn">Delete</button>
                            {post.claimed ? (
                                <button
                                    onClick={() => handleUnmarkAsClaimed(post.id)}
                                    className="mp-btn mp-unclaim-btn"
                                >
                                    Unmark Claimed
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleMarkAsClaimed(post.id)}
                                    className="mp-btn mp-claim-btn"
                                >
                                    Mark as Claimed
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Comment Button - Always visible, toggles comment section */}
                <div className="mp-comment-toggle-area">
                    <button
                        onClick={() => toggleComments(post.id)}
                        className="mp-btn mp-toggle-comments-btn"
                    >
                        {openCommentPostId === post.id ? 'Hide Comments' : `Comments (${post.comments?.length || 0})`}
                    </button>
                </div>
            </div> {/* End mp-post-footer-actions */}


            {/* Comments Section - Conditionally rendered (only if open) */}
            {openCommentPostId === post.id && (
              <div className="mp-comments-section">
                <h4 className="mp-comments-title">Comments:</h4>
                <div
                  ref={(el) => (commentsRef.current[post.id] = el)}
                  className="mp-comments-container"
                >
                  {post.comments?.length > 0 ? (
                    post.comments.map((comment, index) => (
                      <div key={index} className="mp-comment">
                        <p className="mp-comment-text">
                          <strong>{comment.author}</strong>
                          {comment.isAnonymous && (
                            <span className="mp-anon-comment-badge">
                                <span role="img" aria-label="anonymous">🕵️</span>
                            </span>
                          )}
                          : {comment.text}
                        </p>
                        <p className="mp-comment-time">
                          {comment.timestamp ? timeAgo(comment.timestamp) : 'Just now'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="mp-no-comments">No comments yet. Be the first to comment!</p>
                  )}
                </div>

                {/* Add Comment Area */}
                {user ? (
                    <div className="mp-add-comment-area-wrapper">
                        <h5 className="mp-add-comment-heading">Add Your Comment</h5>
                        <textarea
                            placeholder={isSubmittingComment[post.id] ? "Sending comment..." : "Type your comment here..."}
                            value={commentTexts[post.id] || ''}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                            className="mp-comment-textarea"
                            rows="3"
                            disabled={isSubmittingComment[post.id]}
                        />
                        <div className="mp-comment-options">
                            <label htmlFor={`anonymous-comment-${post.id}`} className="mp-anonymous-label">
                                <input
                                    type="checkbox"
                                    id={`anonymous-comment-${post.id}`}
                                    checked={isAnonymousComment}
                                    onChange={(e) => setIsAnonymousComment(e.target.checked)}
                                    disabled={isSubmittingComment[post.id]}
                                />
                                Comment as Anonymous
                            </label>
                            <button
                                onClick={() => handleAddComment(post.id)}
                                className="mp-btn mp-add-comment-btn"
                                disabled={isSubmittingComment[post.id]}
                            >
                                {isSubmittingComment[post.id] ? 'Sending...' : 'Post Comment'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="mp-login-to-comment-message">Log in to add a comment.</p>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MyPost;