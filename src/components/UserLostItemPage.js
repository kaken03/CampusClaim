import React, { useEffect, useState, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp, deleteDoc, getDoc, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import './UserLostItemPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faEllipsisH, faCheckCircle, faExclamationTriangle, faBan, faEdit, faTrash, faTimes, faImage, faUser } from '@fortawesome/free-solid-svg-icons';
import UserReport from './UserReport';
import Comment from './Comment';
// A reusable modal component
const CustomModal = ({ title, message, onConfirm, onCancel, confirmText, cancelText }) => {
  return (
    <div className="ui-modal-overlay">
      <div className="ui-modal-content">
        <div className="ui-modal-header">
          <h4 className="ui-modal-title">{title}</h4>
          {onCancel && <button onClick={onCancel} className="ui-modal-close-btn"><FontAwesomeIcon icon={faTimes} /></button>}
        </div>
        <p className="ui-modal-message">{message}</p>
        <div className="ui-modal-actions">
          {onConfirm && <button onClick={onConfirm} className="ui-btn ui-btn-primary">{confirmText || 'Confirm'}</button>}
          {onCancel && <button onClick={onCancel} className="ui-btn ui-btn-secondary">{cancelText || 'Cancel'}</button>}
        </div>
      </div>
    </div>
  );
};

// Edit Post Modal Component
const EditPostModal = ({ post, onSave, onCancel }) => {
  const [editedText, setEditedText] = useState(post.text);
  const [isSaving, setIsSaving] = useState(false);

  // Disable save if text is unchanged or empty
  const isTextChanged = editedText.trim() !== post.text.trim();


  const handleSave = async () => {
    setIsSaving(true);
    await onSave(post.id, { text: editedText });
    setIsSaving(false);
  };

  return (
    <div className="ui-modal-overlay">
      <div className="ui-modal-content">
        <h4 className="ui-modal-title">Edit Post</h4>
        <div className="ui-edit-form">
          <textarea
            className="ui-edit-textarea"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows="5"
            disabled={isSaving}
          />
        </div>
        <div className="ui-modal-actions">
          <button onClick={onCancel} className="ui-btn ui-btn-secondary" disabled={isSaving}>Cancel</button>
          <button
            onClick={handleSave}
            className="ui-btn ui-btn-primary"
            disabled={isSaving || !isTextChanged}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

function PostFeed({ schoolName }) {
  const [posts, setPosts] = useState([]);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [blockingPostId, setBlockingPostId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [showReportModalId, setShowReportModalId] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState({ show: false, title: '', message: '' }); 
  const [deletingPostId, setDeletingPostId] = useState(null); 
  // 1. ADD NEW STATE FOR CLAIMING MODAL
  const [claimingPostId, setClaimingPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null); 
  const [verificationStatus, setVerificationStatus] = useState(''); 
  const [showImageModal, setShowImageModal] = useState(false); 
  const [selectedImage, setSelectedImage] = useState(null); 
  const [isSubmittingReport,] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();
  const commentsRef = useRef({});
  const menuRefs = useRef({});

  const displayErrorModal = (title, message) => {
    setShowErrorModal({ show: true, title, message });
  };

  const closeErrorModal = () => {
    setShowErrorModal({ show: false, title: '', message: '' });
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 5) return "Just now";
    if (seconds < 60)  return "Just now"; 
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
  const q = query(collection(db, 'schools', schoolName, 'LostItems'), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const fetchedPosts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPosts(fetchedPosts);
    setLoading(false); // ✅ loading finished
  }, (error) => {
    console.error("Error fetching posts: ", error);
    displayErrorModal("Error", "Failed to fetch posts. Please try again later.");
    setLoading(false); // ✅ stop loading even if there is an error
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

  useEffect(() => {
    const isModalOpen = blockingPostId || showErrorModal.show || showReportModalId || deletingPostId || claimingPostId || editingPost;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${getScrollbarWidth()}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [blockingPostId, showErrorModal.show, showReportModalId, deletingPostId, claimingPostId, editingPost]);

  const getScrollbarWidth = () => {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);
    const inner = document.createElement('div');
    outer.appendChild(inner);
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
    outer.parentNode.removeChild(outer);
    return scrollbarWidth;
  };

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

  useEffect(() => {
    if (!user || !schoolName) {
      setVerificationStatus('');
      return;
    }
    const fetchVerificationStatus = async () => {
      try {
        const userDocRef = doc(db, 'schools', schoolName, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setVerificationStatus(docSnap.data()?.verificationStatus || '');
        } else {
          setVerificationStatus('');
          console.log("User document not found at the nested path.");
        }
      } catch (error) {
        console.error("Error fetching verification status from nested collection:", error);
        setVerificationStatus('');
      }
    };
    fetchVerificationStatus();
  }, [user, schoolName]);

  // Floating message auto-hide
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const toggleComments = (postId) => {
    setOpenCommentPostId(prevId => prevId === postId ? null : postId);
  };

  const handleBlockPost = (postId) => {
    if (!user || !user.email.endsWith('@admin.com')) {
      displayErrorModal("Permission Denied", "You do not have permission to block posts.");
      return;
    }
    setBlockingPostId(postId);
    setOpenMenuPostId(null);
  };

  // const confirmBlockPost = async (postId) => {
  //   try {
  //     const postRef = doc(db, 'schools', schoolName, 'LostItems', postId);
  //     await updateDoc(postRef, { isBlocked: true });
  //     setActionMessage("✅ Post blocked successfully!");
  //   } catch (error) {
  //     console.error('Error blocking post:', error);
  //     displayErrorModal("Error", "Failed to block post.");
  //   } finally {
  //     setBlockingPostId(null);
  //   }
  // };

  // const cancelBlockPost = () => {
  //   setBlockingPostId(null);
  // };

  const handleReportPost = (postId) => {
    setShowReportModalId(postId);
    setOpenMenuPostId(null);
  };


  const handleEditPost = (post) => {
    setEditingPost(post);
    setOpenMenuPostId(null);
  };

  const saveEditedPost = async (postId, updatedData) => {
    try {
      const postRef = doc(db, 'schools', schoolName, 'LostItems', postId);
      await updateDoc(postRef, updatedData);
      setActionMessage("✅ Post updated successfully!");
    } catch (error) {
      console.error("Error updating post:", error);
      displayErrorModal("Error", "Failed to update post.");
    } finally {
      setEditingPost(null);
    }
  };

  const handleDeletePost = (postId) => {
    setDeletingPostId(postId);
    setOpenMenuPostId(null);
  };

  const confirmDeletePost = async (postId) => {
    const originalPosts = posts;
    setPosts(posts.filter(post => post.id !== postId));
    setDeletingPostId(null);

    try {
      const postRef = doc(db, 'schools', schoolName, 'LostItems', postId);
      await deleteDoc(postRef);
      setActionMessage("✅ Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      setPosts(originalPosts);
      displayErrorModal("Error", "Failed to delete post. Please try again.");
    }
  };

  const cancelDelete = () => {
    setDeletingPostId(null);
  };

  const updateClaimStatus = async (postId, newClaimedStatus) => {
    const originalPosts = posts;
    // Optimistic update to make UI feel faster
    setPosts(posts.map(p => p.id === postId ? { ...p, claimed: newClaimedStatus } : p));
    
    try {
      const postRef = doc(db, 'schools', schoolName, 'LostItems', postId);
      await updateDoc(postRef, { claimed: newClaimedStatus });
      setActionMessage(
        newClaimedStatus
          ? "✅ Post marked as claimed!"
          : "✅ Post unmarked as claimed!"
      );
    } catch (error) {
      console.error("Error updating claim status:", error);
      // Revert UI change if update fails
      setPosts(originalPosts);
      displayErrorModal("Error", `Failed to mark post as ${newClaimedStatus ? 'claimed' : 'unclaimed'}. Please try again.`);
    }
  };
  
  // 2. MODIFIED handleClaimPost: Shows the modal instead of claiming
  const handleClaimPost = (postId) => {
      setClaimingPostId(postId);
      setOpenMenuPostId(null); // Close the dropdown menu
  };

  // 3. NEW confirmClaimPost: Performs the actual Firebase update
  const confirmClaimPost = async () => {
      if (claimingPostId) {
          await updateClaimStatus(claimingPostId, true);
          setClaimingPostId(null);
      }
  };

  const cancelClaimPost = () => {
      setClaimingPostId(null);
  };
  // const handleUnclaimPost = (postId) => updateClaimStatus(postId, false);

  const filteredPosts = posts.filter((post) => {
    if (filter === 'claimed' && !post.claimed) return false;
    if (filter === 'unclaimed' && post.claimed) return false;

    if (post.isBlocked && post.authorId !== user?.uid && user?.email !== 'admin.com') {
      return false;
    }
    
    return true;
  });

  const handleEllipsisClick = (postId, event) => {
    event.stopPropagation();
    setOpenMenuPostId(prevId => prevId === postId ? null : postId);
  };

  return (
    <div className="user-post-feed-container">

      {/* Floating success message */}
      {actionMessage && (
        <div className="postfeed-action-message">{actionMessage}</div>
      )}

      {showErrorModal.show && (
        <CustomModal
          title={showErrorModal.title}
          message={showErrorModal.message}
          onCancel={closeErrorModal}
          cancelText="Close"
        />
      )}
      
      {/* 4. CLAIMING CONFIRMATION MODAL */}
      {claimingPostId && (
        <CustomModal
          title="Confirm Claim"
          message="Are you sure you want to mark this post as Claimed? This indicates the item has been successfully recovered."
          onConfirm={confirmClaimPost}
          onCancel={cancelClaimPost}
          confirmText="Mark Claimed"
          cancelText="Cancel"
        />
      )}

      {deletingPostId && (
        <CustomModal
          title="Confirm Deletion"
          message="Are you sure you want to delete this post? This action cannot be undone."
          onConfirm={() => confirmDeletePost(deletingPostId)}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onSave={saveEditedPost}
          onCancel={() => setEditingPost(null)}
        />
      )}

      <div className="ui-filter-bar">
        <span className="ui-filter-label">Filter by status:</span>
        <div className="ui-filter-buttons">
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'ui-filter-btn ui-active-filter' : 'ui-filter-btn'}
          >
            All
          </button>
          <button
            onClick={() => setFilter('claimed')}
            className={filter === 'claimed' ? 'ui-filter-btn ui-active-filter ui-claimed-filter' : 'ui-filter-btn'}
          >
            Claimed
          </button>
          {/* <button
            onClick={() => setFilter('unclaimed')}
            className={filter === 'unclaimed' ? 'ui-filter-btn ui-active-filter ui-unclaimed-filter' : 'ui-filter-btn'}
            >
            Unclaimed
          </button> */}
        </div>
      </div>
      
      {loading ? (
      <div>
        <p className="no-items-message">Loading Lost Items...</p>
      </div>
        ) :filteredPosts.length === 0 ? (
          <div>
            <p className="no-items-message">No lost items have been posted yet.</p>
          </div>
        ) : (
          <div className="ui-post-list">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                id={post.id}
                className={`ui-post-card ${post.id === highlightedPostId ? 'ui-post-highlighted' : ''}`}
              >
                <div className="ui-post-header">
                  <div className="ui-post-author">
                    <div className="ui-author-info">
                      <p className="ui-author-name">
                      {(post.authorName && post.authorName.length > 30)
                        ? post.authorName.slice(0, 30) + '...'
                        : (post.authorName || 'Anonymous')}
                        {post.isAnonymous && user && post.authorId === user.uid && (
                          <span className="ui-my-anonymous-badge" title="This is your anonymous post">
                            <FontAwesomeIcon icon={faUser} />
                          </span>
                        )}
                      </p>
                      <p className="ui-post-time">{post.createdAt ? timeAgo(post.createdAt) : '...'}</p>
                    </div>
                  </div>

                  <div className="ui-post-menu-container" ref={(el) => (menuRefs.current[post.id] = el)}>
                    <button className="ui-post-menu-btn" onClick={(e) => handleEllipsisClick(post.id, e)}>
                      <FontAwesomeIcon icon={faEllipsisH} />
                    </button>
                    {openMenuPostId === post.id && (
                      <div className="ui-post-menu-dropdown">
                        {post.isBlocked ? (
                          (post.authorId === user?.uid || user?.email.endsWith('@admin.com')) && (
                            <button onClick={() => handleDeletePost(post.id)} className="ui-dropdown-item ui-dropdown-item-danger"><FontAwesomeIcon icon={faTrash} /> Delete Post</button>
                          )
                        ) : (
                          <>
                            {post.authorId === user?.uid && (
                              <>
                                <button onClick={() => handleEditPost(post)} className="ui-dropdown-item"><FontAwesomeIcon icon={faEdit} /> Edit Post</button>
                                <button onClick={() => handleDeletePost(post.id)} className="ui-dropdown-item ui-dropdown-item-danger"><FontAwesomeIcon icon={faTrash} /> Delete Post</button>
                                {!post.claimed && (
                                  <button
                                    onClick={() => handleClaimPost(post.id)} // Calls the function that shows the modal
                                    className="ui-dropdown-item"
                                  >
                                    <FontAwesomeIcon icon={faCheckCircle} /> Mark as Claimed
                                  </button>
                                )}
                              </>
                            )}
                            {post.authorId !== user?.uid && (
                              <button onClick={() => handleReportPost(post.id)} className="ui-dropdown-item"><FontAwesomeIcon icon={faExclamationTriangle} /> Report Post</button>
                            )}
                            {user?.email.endsWith('@admin.com') && (
                              <button onClick={() => handleBlockPost(post.id)} className="ui-dropdown-item ui-dropdown-item-danger"><FontAwesomeIcon icon={faBan} /> Block Post</button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {post.isBlocked && post.authorId === user?.uid && (
                  <div className="ui-blocked-warning">
                    <FontAwesomeIcon icon={faBan} /> This post is blocked by the admin.
                  </div>
                )}
                
                <div className="ui-post-body">
                  <p className="ui-post-text">{post.text}</p>
                </div>
                {post.imageUrl && (
                  <button
                    className="see-photo-btn"
                    onClick={() => {
                      setSelectedImage(post.imageUrl);
                      setShowImageModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faImage} /> See Photo
                  </button>
                )}
                {showImageModal && selectedImage && (
                  <div className="ui-modal-overlay" onClick={() => setShowImageModal(false)}>
                    <div className="ui-modal-content" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="close-btn"
                        onClick={() => setShowImageModal(false)}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                      <img src={selectedImage} alt="Post" className="modal-image" />
                    </div>
                  </div>
                )}    

                <div className="ui-post-footer">
                  <div className="ui-status-badges">
                    {post.claimed && <span className="ui-badge ui-badge-claimed">Claimed</span>}
                  </div>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="ui-comments-toggle-btn"
                  >
                    <FontAwesomeIcon icon={faComment} />
                    <span>Comments</span>
                  </button>
                </div>


                <UserReport
                  show={showReportModalId === post.id}
                  postId={post.id}
                  onCancel={() => setShowReportModalId(null)}
                  isSubmittingReport={isSubmittingReport}
                  user={user}
                  schoolName={schoolName}
                  setShowReportModalId={setShowReportModalId}
                  setActionMessage={setActionMessage} // <-- Pass this prop
                />

                {openCommentPostId === post.id && (
                  <Comment
                    post={post}
                    user={user}
                    verificationStatus={verificationStatus}
                    commentsRef={commentsRef}
                    timeAgo={timeAgo}
                    displayErrorModal={displayErrorModal}
                    schoolName={schoolName}
                  />
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

export default PostFeed;