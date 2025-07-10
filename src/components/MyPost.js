import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, Timestamp, setDoc, getDoc, serverTimestamp, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import ChatBox from './ChatBox'; // Import your ChatBox component

function MyPost() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('all');
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState('');
  const [commentTexts, setCommentTexts] = useState({});
  const [filter, setFilter] = useState('all');
  const [activeChatId, setActiveChatId] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();
  const commentsRef = useRef({});

  // Utility function to calculate "time ago"
  const timeAgo = (timestamp) => {
    const now = new Date();
    const timeDiff = now - new Date(timestamp);
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${weeks}w ago`;
  };

  useEffect(() => {
    // Parse query parameters
    const params = new URLSearchParams(location.search);
    const postId = params.get('postId');
    const collectionParam = params.get('collection');
    if (postId && collectionParam) {
      setCategory(collectionParam === 'LostItems' ? 'lost' : 'found');
      setHighlightedPostId(postId);
    }
  }, [location]);

  useEffect(() => {
    if (!user) return;

    let unsubLost = () => {};
    let unsubFound = () => {};

    if (category === 'all') {
      // Use getDocs for one-time fetch, or use two onSnapshot and combine in memory
      const qLost = query(
        collection(db, 'LostItems'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const qFound = query(
        collection(db, 'FoundItems'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      // Use getDocs to fetch both, then combine
      import('firebase/firestore').then(({ getDocs }) => {
        Promise.all([getDocs(qLost), getDocs(qFound)]).then(([lostSnap, foundSnap]) => {
          const lostPosts = lostSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            _type: 'lost',
          }));
          const foundPosts = foundSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            _type: 'found',
          }));
          setPosts(
            [...lostPosts, ...foundPosts].sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
          );
        });
      });

      // Optionally, you can set up listeners if you want real-time updates for both:
      unsubLost = onSnapshot(qLost, (snapshot) => {
        const lostPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _type: 'lost',
        }));
        setPosts((prev) => {
          const foundPosts = prev.filter((p) => p._type === 'found');
          return [...lostPosts, ...foundPosts].sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
        });
      });
      unsubFound = onSnapshot(qFound, (snapshot) => {
        const foundPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _type: 'found',
        }));
        setPosts((prev) => {
          const lostPosts = prev.filter((p) => p._type === 'lost');
          return [...lostPosts, ...foundPosts].sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
        });
      });
    } else {
      const collectionName = category === 'lost' ? 'LostItems' : 'FoundItems';
      const q = query(
        collection(db, collectionName),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _type: category,
        }));
        setPosts(postsData);
      });
      if (category === 'lost') unsubLost = unsub;
      else unsubFound = unsub;
    }

    return () => {
      unsubLost();
      unsubFound();
    };
  }, [category, user]);

  useEffect(() => {
    Object.values(commentsRef.current).forEach((ref) => {
      if (ref) {
        ref.scrollTop = ref.scrollHeight;
      }
    });
  }, [posts]);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deleteDoc(doc(db, category === 'lost' ? 'LostItems' : 'FoundItems', postId));
      alert('Post deleted successfully!');
    }
  };

  const handleEdit = async (postId) => {
    if (!editText.trim()) return;
    await updateDoc(doc(db, category === 'lost' ? 'LostItems' : 'FoundItems', postId), { text: editText });
    setEditingPostId(null);
    setEditText('');
    alert('Post updated successfully!');
  };

  const handleCommentChange = (postId, text) => {
    setCommentTexts((prev) => ({
      ...prev,
      [postId]: text,
    }));
  };

  const handleAddComment = async (postId) => {
    if (!commentTexts[postId]?.trim()) return;
    const postRef = doc(db, category === 'lost' ? 'LostItems' : 'FoundItems', postId);
    const post = posts.find((p) => p.id === postId);
    const userName = user?.displayName || 'Anonymous';
    const newComment = {
      text: commentTexts[postId],
      author: userName,
      timestamp: Timestamp.now(),
    };
    const updatedComments = [...(post.comments || []), newComment];

    await updateDoc(postRef, { comments: updatedComments });
    setCommentTexts((prev) => ({
      ...prev,
      [postId]: '',
    }));
  };

  const handleMarkAsClaimed = async (postId) => {
    const postRef = doc(db, category === 'lost' ? 'LostItems' : 'FoundItems', postId);
    await updateDoc(postRef, { claimed: true });
    alert('Post marked as claimed!');
  };

  const handleUnmarkAsClaimed = async (postId) => {
    const postRef = doc(db, category === 'lost' ? 'LostItems' : 'FoundItems', postId);
    await updateDoc(postRef, { claimed: false });
  };
  // Filtered posts based on the selected filter (all, claimed, unclaimed),
  // and the blocked logic
  // Filtered posts based on the selected filter (all, claimed, unclaimed)
  const filteredPosts = posts.filter((post) => {
    if (post.isBlocked && post.authorId !== user?.uid) return false;
    if (filter === 'claimed') return post.claimed;
    if (filter === 'unclaimed') return !post.claimed;
    return true;
  });

  const openChatWith = async (otherUserId) => {
    const currentUserId = user.uid;
    // Create a unique chatId for the two users (sorted to avoid duplicates)
    const chatId = [currentUserId, otherUserId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants: [currentUserId, otherUserId],
        lastUpdated: serverTimestamp(),
        lastMessage: '',
      });
    }
    // Redirect to chat UI (e.g., open modal or navigate to /chat/:chatId)
    // Example: navigate(`/chat/${chatId}`);
    setActiveChatId(chatId); // If using a modal or drawer
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postId = params.get('postId');
    if (postId) {
      // Wait for posts to render, then scroll
      setTimeout(() => {
        const el = document.getElementById(postId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' }); // 'auto' is instant
          setHighlightedPostId(postId);
        }
      }, 100); // Lower delay for faster scroll
    }
  }, [location.search, posts]);

  return (
    <div style={styles.feed}>
      <h2 style={styles.title}>Posts</h2>
      <div style={styles.categorySelector}>
        <button
          onClick={() => setCategory('all')}
          style={
            category === 'all'
              ? { ...styles.activeCategoryButton, backgroundColor: '#1d3557', color: '#fff' }
              : styles.categoryButton
          }
        >
          All
        </button>
        <button
          onClick={() => setCategory('found')}
          style={
            category === 'found'
              ? { ...styles.activeCategoryButton, backgroundColor: '#007BFF', color: '#fff' }
              : styles.categoryButton
          }
        >
          Found Items
        </button>
        <button
          onClick={() => setCategory('lost')}
          style={
            category === 'lost'
              ? { ...styles.activeCategoryButton, backgroundColor: '#FF4D4D', color: '#fff' }
              : styles.categoryButton
          }
        >
          Lost Items
        </button>
        
      </div>
      <div style={styles.filterSelector}>
        <span style={{ alignSelf: 'center', marginRight: 10, fontWeight: 'bold', color: '#333' }}>
    Filter:
  </span>
        <button
          onClick={() => setFilter('all')}
          style={
            filter === 'all'
              ? { ...styles.activeFilterButton, backgroundColor: '#1d3557', color: '#fff' }
              : styles.filterButton
          }
        >
          All
        </button>
        <button
          onClick={() => setFilter('claimed')}
          style={
            filter === 'claimed'
              ? { ...styles.activeFilterButton, backgroundColor: '#28a745', color: '#fff' }
              : styles.filterButton
          }
        >
          Claimed
        </button>
        <button
          onClick={() => setFilter('unclaimed')}
          style={
            filter === 'unclaimed'
              ? { ...styles.activeFilterButton, backgroundColor: '#FF4D4D', color: '#fff' }
              : styles.filterButton
          }
        >
          Unclaimed
        </button>
      </div>
      {filteredPosts.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No posts found.</p>
      ) : (
        filteredPosts.map((post) => (
          <div
            key={post.id}
            id={post.id}
            style={{
              ...styles.postCard,
              borderColor: category === 'lost' ? '#FF4D4D' : '#007BFF',
              borderWidth: '2px',
              borderStyle: 'solid',
              backgroundColor: post.id === highlightedPostId ? '#FFFFE0' : '#fff',
            }}
          >
            <p style={styles.author}>
  <strong>{post.authorName}</strong> posted:
  {category === 'all' && (
    <span
      style={{
        marginLeft: 10,
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '0.95em',
        fontWeight: 600,
        backgroundColor: post._type === 'lost' ? '#FF4D4D' : '#007BFF',
        color: '#fff',
        verticalAlign: 'middle',
      }}
    >
      {post._type === 'lost' ? 'Lost Item' : 'Found Item'}
    </span>
  )}
</p>
            {post.imageUrl && <img src={post.imageUrl} alt="Post" style={styles.image} />}
            {/* Blocked post message for author */}
            {post.isBlocked && post.authorId === user?.uid ? (
              <div style={{
                background: '#ffeaea',
                color: '#e63946',
                padding: '16px',
                borderRadius: '8px',
                margin: '12px 0',
                fontWeight: 600,
                fontSize: '1.1rem',
                textAlign: 'center',
              }}>
                This post is blocked by the admin. 
                Only you can see this post.
              </div>
            ) : (
              editingPostId === post.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={styles.textarea}
                  />
                  <button onClick={() => handleEdit(post.id)} style={styles.button}>
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingPostId(null);
                      setEditText('');
                    }}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p style={styles.text}>{post.text}</p>
              )
            )}
            <p style={styles.date}>{post.createdAt?.toDate().toLocaleString()}</p>
            {post.authorId === user?.uid && !post.isBlocked && (
              <div style={styles.actions}>
                <button
                  onClick={() => {
                    setEditingPostId(post.id);
                    setEditText(post.text);
                  }}
                  style={styles.button}
                >
                  Edit
                </button>
                <button onClick={() => handleDelete(post.id)} style={styles.deleteButton}>
                  Delete
                </button>
              </div>
            )}
            {post.claimed && (
              <div style={styles.claimedBadge}>Claimed</div>
            )}
            {post.claimed && post.authorId === user?.uid && !post.isBlocked && (
              <button
                onClick={() => handleUnmarkAsClaimed(post.id)}
                style={{ ...styles.claimButton, backgroundColor: '#ffc107', color: '#333', marginLeft: 8 }}
              >
                Unmark as Claimed
              </button>
            )}
            {!post.claimed && post.authorId === user?.uid && (
              <button
                onClick={() => handleMarkAsClaimed(post.id)}
                style={styles.claimButton}
              >
                Mark as Claimed
              </button>
            )}
            <div style={styles.commentsSection}>
              <h4>Comments:</h4>
              <div
                ref={(el) => (commentsRef.current[post.id] = el)}
                style={{
                  ...styles.commentsContainer,
                  overflowY: 'auto',
                  maxHeight: '200px',
                }}
              >
                {post.comments?.length > 0 ? (
                  post.comments.map((comment, index) => (
                    <div key={index} style={styles.comment}>
                      <p>
                        <strong>{comment.author}</strong>: {comment.text}
                      </p>
                      <p style={styles.commentTime}>
                        {comment.timestamp ? timeAgo(comment.timestamp.toDate()) : 'Just now'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={styles.noComments}>No comments yet.</p>
                )}
              </div>
              <textarea
                placeholder="Add a comment..."
                value={commentTexts[post.id] || ''}
                onChange={(e) => handleCommentChange(post.id, e.target.value)}
                style={styles.textarea}
              />
              <button onClick={() => handleAddComment(post.id)} style={styles.button}>
                Add Comment
              </button>
              {post.authorId !== user?.uid && (
                <button
                  style={{ ...styles.button, backgroundColor: '#1d3557', marginLeft: 8 }}
                  onClick={() => openChatWith(post.authorId)}
                >
                  Private Message
                </button>
              )}
            </div>
            
          </div>
        ))
      )}
      {activeChatId && (
        <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1000 }}>
          <ChatBox
            chatId={activeChatId}
            currentUserId={user.uid}
            onClose={() => setActiveChatId(null)}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  feed: {
    maxWidth: '700px',
    margin: '40px auto',
    padding: '32px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '2.2rem',
    color: '#1d3557',
    textAlign: 'center',
    marginBottom: '32px',
    fontWeight: 700,
    letterSpacing: '1px',
  },
  categorySelector: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
    gap: '12px',
  },
  categoryButton: {
    padding: '12px 28px',
    fontSize: '1.1rem',
    color: '#457b9d',
    backgroundColor: '#fff',
    border: '1px solid #1d3557',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  activeCategoryButton: {
    padding: '12px 28px',
    fontSize: '1.1rem',
    border: '1px solid #1d3557',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    background: '#1d3557',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(69,123,157,0.08)',
  },
  filterSelector: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
    gap: '10px',
  },
  filterButton: {
    padding: '8px 18px',
    fontSize: '1rem',
    color: '#457b9d',
    backgroundColor: '#fff',
    border: '1.5px solid #457b9d',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  activeFilterButton: {
    padding: '8px 18px',
    fontSize: '1rem',
    border: '1.5px solid #457b9d',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    background: '#1d3557',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(69,123,157,0.08)',
  },
  postCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(69,123,157,0.10)',
    border: '2px solid #e0e7ff',
    transition: 'box-shadow 0.2s, border 0.2s',
  },
  author: {
    fontSize: '1rem',
    color: '#457b9d',
    marginBottom: '8px',
    fontWeight: 600,
  },
  image: {
    width: '100%',
    borderRadius: '12px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(69,123,157,0.08)',
  },
  text: {
    fontSize: '1.1rem',
    margin: '12px 0',
    color: '#22223b',
    fontWeight: 500,
  },
  date: {
    fontSize: '0.9rem',
    color: '#adb5bd',
    marginBottom: '8px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  button: {
    padding: '8px 18px',
    fontSize: '1rem',
    color: '#fff',
    background: '#1d3557',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background 0.2s',
    marginRight: '5px',
  },
  deleteButton: {
    padding: '8px 18px',
    fontSize: '1rem',
    color: '#fff',
    background: '#e63946',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background 0.2s',
  },
  cancelButton: {
    padding: '8px 18px',
    fontSize: '1rem',
    color: '#fff',
    background: 'linear-gradient(90deg, #adb5bd 0%, #6c757d 100%)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background 0.2s',
  },
  claimedBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    fontSize: '1rem',
    color: '#fff',
    background: '#70e000',
    borderRadius: '16px',
    marginTop: '10px',
    fontWeight: 'bold',
    boxShadow: '0 1px 4px rgba(56,176,0,0.10)',
  },
  claimButton: {
    display: 'inline-block',
    padding: '8px 18px',
    fontSize: '1rem',
    color: '#fff',
    background: '#70e000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px',
    boxShadow: '0 1px 4px rgba(56,176,0,0.10)',
  },
  commentsSection: {
    marginTop: '18px',
    backgroundColor: '#f1f3f8',
    padding: '16px',
    borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(69,123,157,0.04)',
  },
  commentsContainer: {
    maxHeight: '150px',
    overflowY: 'auto',
    marginBottom: '10px',
  },
  comment: {
    fontSize: '1rem',
    color: '#495057',
    marginBottom: '7px',
    background: '#e9ecef',
    borderRadius: '6px',
    padding: '8px 12px',
  },
  commentTime: {
    fontSize: '0.85rem',
    color: '#adb5bd',
    marginTop: '-5px',
    marginLeft: '8px',
  },
  noComments: {
    fontSize: '1rem',
    color: '#adb5bd',
  },
  textarea: {
    width: '100%',
    height: '60px',
    padding: '12px',
    marginBottom: '10px',
    fontSize: '1rem',
    border: '1.5px solid #ced4da',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
};

export default MyPost;