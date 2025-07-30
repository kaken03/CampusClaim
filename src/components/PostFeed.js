import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import './PostFeed.css'; // Ensure this path is correct

function PostFeed({ schoolName }) {
  const [posts, setPosts] = useState([]);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState({});
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  // Removed: showReportModalId, reportMessage states
  const [blockingPostId, setBlockingPostId] = useState(null); // Keep blocking state
  const [filter, setFilter] = useState('all');
  const [openMenuPostId, setOpenMenuPostId] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();
  const commentsRef = useRef({});
  const submittingCommentRef = useRef({});
  const menuRefs = useRef({}); // Ref to hold dropdown menu DOM elements

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postId = params.get('postId');
    if (postId) {
      setHighlightedPostId(postId);
      setOpenCommentPostId(postId);
    }
  }, [location]);

  useEffect(() => {
    if (!schoolName) return;

    const q = query(
      collection(db, 'schools', schoolName, 'LostItems'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetchedPosts);
    }, (error) => {
      console.error("Error fetching posts: ", error);
    });

    return () => unsubscribe();
  }, [schoolName]);

  useEffect(() => {
    if (highlightedPostId && posts.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(highlightedPostId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [highlightedPostId, posts]);

  useEffect(() => {
    if (openCommentPostId && commentsRef.current[openCommentPostId]) {
      const ref = commentsRef.current[openCommentPostId];
      ref.scrollTop = ref.scrollHeight;
    }
  }, [posts, openCommentPostId]);

  // Updated useEffect for handling body scroll: only depends on blockingPostId now
  useEffect(() => {
    if (blockingPostId) { // Check if the block modal is open
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      // Add padding-right to compensate for scrollbar disappearance, preventing layout shift
      document.body.style.paddingRight = getScrollbarWidth() + 'px';
    } else {
      document.body.style.overflow = 'unset'; // Allow scrolling
      document.body.style.paddingRight = '0px';
    }
    // Cleanup function to ensure scrolling is re-enabled if component unmounts
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [blockingPostId]); // Only re-run when blockingPostId changes

  // Helper function to calculate scrollbar width dynamically (kept for blocking modal)
  const getScrollbarWidth = () => {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // Force scrollbars
    document.body.appendChild(outer);
    const inner = document.createElement('div');
    outer.appendChild(inner);
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
    outer.parentNode.removeChild(outer);
    return scrollbarWidth;
  };

  // Effect to close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuPostId && menuRefs.current[openMenuPostId] && !menuRefs.current[openMenuPostId].contains(event.target)) {
        setOpenMenuPostId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuPostId]);


  const handleCommentChange = (postId, text) => {
    setCommentTexts((prev) => ({
      ...prev,
      [postId]: text,
    }));
  };

  const handleAddComment = async (postId) => {
    if (submittingCommentRef.current[postId]) {
      console.log(`[Local Guard] Comment for post ${postId} is already being submitted. Ignoring duplicate click.`);
      return;
    }
    submittingCommentRef.current[postId] = true;

    const commentText = commentTexts[postId]?.trim();

    if (!commentText) {
      alert('Comment cannot be empty.');
      submittingCommentRef.current[postId] = false;
      return;
    }
    if (!user) {
      alert('You must be logged in to comment.');
      submittingCommentRef.current[postId] = false;
      return;
    }

    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));

    const postRef = doc(db, 'schools', schoolName, 'LostItems', postId);

    const commentAuthorName = isAnonymousComment ? 'Anonymous User' : (user?.displayName || 'Anonymous User');

    const newComment = {
      text: commentText,
      author: commentAuthorName,
      authorId: user.uid,
      isAnonymous: isAnonymousComment,
      timestamp: Timestamp.now(),
    };

    try {
      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
      });
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
      submittingCommentRef.current[postId] = false;
    }
  };

  const toggleComments = (postId) => {
    setOpenCommentPostId(prevId => prevId === postId ? null : postId);
  };

  // Removed: handleReportPost function
  // Removed: confirmReport function
  // Removed: cancelReport function

  const handleBlockPost = (postId) => {
    if (!user || !user.email.endsWith('@admin.com')) {
      alert('You do not have permission to block posts.');
      return;
    }
    setBlockingPostId(postId);
    setOpenMenuPostId(null); // Close menu after action
  };

  const confirmBlockPost = async (postId) => {
    try {
      const postRef = doc(db, 'schools', schoolName, 'LostItems', postId);
      await updateDoc(postRef, { isBlocked: true });
      alert('Post blocked successfully!');
    } catch (error) {
      console.error('Error blocking post:', error);
      alert('Failed to block post.');
    } finally {
      setBlockingPostId(null);
    }
  };

  const cancelBlockPost = () => {
    setBlockingPostId(null);
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === 'claimed') return post.claimed;
    if (filter === 'unclaimed') return !post.claimed;
    return true;
  });

  // Function to toggle the ellipsis menu for a post
  const handleEllipsisClick = (postId, event) => {
    event.stopPropagation(); // Prevent click from bubbling up and closing other menus
    setOpenMenuPostId(prevId => prevId === postId ? null : postId);
  };

  return (
    <div className="post-feed-container">
      <h2 className="post-feed-title">Lost Items</h2>

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
        <p className="no-posts-message">No lost items to display yet. Be the first to post!</p>
      ) : (
        filteredPosts.map((post) => (
          <div
            key={post.id}
            id={post.id}
            className={`post-card ${post.id === highlightedPostId ? 'highlighted-post' : ''} ${post.claimed ? 'claimed-post' : ''}`}
          >
            <div className="card-header">
              <p className="post-author">
                {post.isAnonymous ? (
                  <>
                    <strong>Anonymous User</strong>
                    <span className="anon-badge">
                        <span role="img" aria-label="anonymous">🕵️</span> Anonymous
                    </span>
                  </>
                ) : (
                  <>
                    <strong>{post.authorName}</strong>
                    {post.authorId === user?.uid && (
                      <span className="your-post-badge">Your Post</span>
                    )}
                  </>
                )}
                {post.claimed && (
                    <span className="claimed-indicator">
                        <span role="img" aria-label="claimed">✅</span> Claimed
                    </span>
                )}
              </p>
              <p className="post-date">{post.createdAt ? timeAgo(post.createdAt) : '...'}</p>

              {/* Ellipsis Menu Button - Report Post option removed */}
              {user?.email.endsWith('@admin.com') ? ( // Only show ellipsis if admin to allow blocking
                <div className="ellipsis-menu-container" ref={(el) => (menuRefs.current[post.id] = el)}>
                  <button className="ellipsis-button" onClick={(e) => handleEllipsisClick(post.id, e)}>
                    ...
                  </button>
                  {openMenuPostId === post.id && (
                    <div className="ellipsis-dropdown">
                      {user?.email.endsWith('@admin.com') && (
                        <button onClick={() => handleBlockPost(post.id)} className="dropdown-item block-btn">Block Post</button>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

            </div>

            {post.imageUrl && (
              <div className="image-container">
                <img src={post.imageUrl} alt="Post" className="post-image" />
              </div>
            )}

            <p className="post-text">{post.text}</p>

            {/* Removed: Report Confirmation Modal */}

            {/* Block Confirmation Modal (Now directly in JSX) */}
            {blockingPostId === post.id && (
                <div className="report-modal-overlay"> {/* Reusing overlay styles */}
                    <div className="report-modal-content">
                        <h4 className="modal-title">Confirm Block</h4>
                        <p className="modal-message">Are you sure you want to **block** this post? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button onClick={() => confirmBlockPost(post.id)} className="modal-confirm-btn modal-block-confirm-btn">Yes, Block</button>
                            <button onClick={cancelBlockPost} className="modal-cancel-btn">No, Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="comment-toggle-area">
                <button
                    onClick={() => toggleComments(post.id)}
                    className="toggle-comments-btn"
                >
                    {openCommentPostId === post.id ? 'Hide Comments' : `Comments (${post.comments?.length || 0})`}
                </button>
            </div>

            {openCommentPostId === post.id && (
              <div className="comments-section">
                <h4 className="comments-title">Comments:</h4>
                <div
                  ref={(el) => (commentsRef.current[post.id] = el)}
                  className="comments-container"
                >
                  {post.comments?.length > 0 ? (
                    post.comments.map((comment, index) => (
                      <div key={index} className="comment">
                        <p className="comment-text">
                          <strong>{comment.author}</strong>
                          {comment.isAnonymous && (
                            <span className="anon-comment-badge">
                                <span role="img" aria-label="anonymous">🕵️</span>
                            </span>
                          )}
                          : {comment.text}
                        </p>
                        <p className="comment-time">
                          {comment.timestamp ? timeAgo(comment.timestamp) : 'Just now'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="no-comments">No comments yet. Be the first to comment!</p>
                  )}
                </div>

                {user ? (
                    <div className="add-comment-area-wrapper">
                        <h5 className="add-comment-heading">Add Your Comment</h5>
                        <textarea
                            placeholder={isSubmittingComment[post.id] ? "Sending comment..." : "Type your comment here..."}
                            value={commentTexts[post.id] || ''}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                            className="comment-textarea"
                            rows="3"
                            disabled={isSubmittingComment[post.id]}
                        />
                        <div className="comment-options">
                            <label htmlFor={`anonymous-comment-${post.id}`} className="anonymous-label">
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
                                className="add-comment-btn"
                                disabled={isSubmittingComment[post.id]}
                            >
                                {isSubmittingComment[post.id] ? 'Sending...' : 'Post Comment'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="login-to-comment-message">Log in to add a comment.</p>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default PostFeed;