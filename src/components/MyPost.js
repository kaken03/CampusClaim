import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function MyPost() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('lost'); // Default to "Lost Items"
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState('');
  const [commentTexts, setCommentTexts] = useState({}); // Separate comment state for each post
  const auth = getAuth();
  const user = auth.currentUser;

  // Utility function to calculate "time ago"
  const timeAgo = (timestamp) => {
    const now = new Date();
    const timeDiff = now - new Date(timestamp); // Difference in milliseconds

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
    if (!user) return;

    // Clear posts when category changes
    setPosts([]);

    // Determine the collection name based on the selected category
    const collectionName = category === 'lost' ? 'LostItems' : 'FoundItems';

    // Query the collection for posts by the logged-in user
    const q = query(
      collection(db, collectionName),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [category, user]);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      const collectionName = category === 'lost' ? 'LostItems' : 'FoundItems';
      await deleteDoc(doc(db, collectionName, postId));
      alert('Post deleted successfully!');
    }
  };

  const handleEdit = async (postId) => {
    if (!editText.trim()) return;
    const collectionName = category === 'lost' ? 'LostItems' : 'FoundItems';
    await updateDoc(doc(db, collectionName, postId), {
      text: editText,
    });
    setEditingPostId(null);
    setEditText('');
    alert('Post updated successfully!');
  };

  const handleCommentChange = (postId, text) => {
    // Update the comment text for the specific post
    setCommentTexts((prev) => ({
      ...prev,
      [postId]: text,
    }));
  };

  const handleAddComment = async (postId) => {
    if (!commentTexts[postId]?.trim()) return;

    const collectionName = category === 'lost' ? 'LostItems' : 'FoundItems';
    const postRef = doc(db, collectionName, postId);
    const post = posts.find((p) => p.id === postId);
    const userName = user?.displayName || 'Anonymous';
    const newComment = {
      text: commentTexts[postId],
      author: userName,
      timestamp: Timestamp.now(), // Firebase timestamp
    };

    try {
      // Update the comments in Firestore
      const updatedComments = [...(post.comments || []), newComment];
      await updateDoc(postRef, { comments: updatedComments });

      // Immediately update the local state to reflect the new comment
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, comments: updatedComments } : p
        )
      );

      setCommentTexts((prev) => ({
        ...prev,
        [postId]: '', // Clear the input for the specific post
      }));
    } catch (error) {
      console.error('Error adding comment: ', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  return (
    <div style={styles.feed}>
      <h2 style={styles.title}>My Posts</h2>
      <div style={styles.categorySelector}>
        <button
          onClick={() => setCategory('lost')}
          style={
            category === 'lost'
              ? { ...styles.activeCategoryButton, backgroundColor: '#FF4D4D', color: '#fff' } // Red for Lost Items
              : styles.categoryButton
          }
        >
          Lost Items
        </button>
        <button
          onClick={() => setCategory('found')}
          style={
            category === 'found'
              ? { ...styles.activeCategoryButton, backgroundColor: '#007BFF', color: '#fff' } // Blue for Found Items
              : styles.categoryButton
          }
        >
          Found Items
        </button>
      </div>
      {posts.length === 0 ? (
        <p style={{ textAlign: 'center' }}>You haven't posted anything in this category yet.</p>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            style={{
              ...styles.postCard,
              borderColor: category === 'lost' ? '#FF4D4D' : '#007BFF', // Red for Lost Items, Blue for Found Items
              borderWidth: '2px',
              borderStyle: 'solid',
            }}
          >
            <p style={styles.author}>
              <strong>{post.authorName}</strong> posted:
            </p>
            {post.imageUrl && <img src={post.imageUrl} alt="Post" style={styles.image} />}
            {editingPostId === post.id ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={styles.textarea}
                />
                <button onClick={() => handleEdit(post.id)} style={styles.button}>
                  Save
                </button>
                <button onClick={() => setEditingPostId(null)} style={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            ) : (
              <p style={styles.text}>{post.text}</p>
            )}
            <p style={styles.date}>{post.createdAt?.toDate().toLocaleString()}</p>

            <div style={styles.actions}>
              <button onClick={() => setEditingPostId(post.id)} style={styles.button}>
                Edit
              </button>
              <button onClick={() => handleDelete(post.id)} style={styles.deleteButton}>
                Delete
              </button>
            </div>

            <div style={styles.commentsSection}>
              <h4>Comments:</h4>
              <div style={styles.commentsContainer}>
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
                value={commentTexts[post.id] || ''} // Use specific post comment text
                onChange={(e) => handleCommentChange(post.id, e.target.value)}
                style={styles.textarea}
              />
              <button onClick={() => handleAddComment(post.id)} style={styles.button}>
                Add Comment
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  feed: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: '1.8rem',
    color: '#1877F2',
    textAlign: 'center',
    marginBottom: '20px',
  },
  categorySelector: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  categoryButton: {
    padding: '10px 20px',
    margin: '0 5px',
    fontSize: '1rem',
    color: '#007BFF',
    backgroundColor: '#fff',
    border: '1px solid #007BFF',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  activeCategoryButton: {
    padding: '10px 20px',
    margin: '0 5px',
    fontSize: '1rem',
    border: '1px solid #007BFF',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  postCard: {
    background: '#fff',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  author: {
    fontSize: '0.9rem',
    color: '#333',
    marginBottom: '5px',
  },
  image: {
    width: '100%',
    borderRadius: '8px',
  },
  text: {
    fontSize: '1rem',
    margin: '10px 0',
  },
  date: {
    fontSize: '0.8rem',
    color: '#888',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
  button: {
    padding: '8px 12px',
    fontSize: '0.9rem',
    color: '#fff',
    backgroundColor: '#007BFF',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  deleteButton: {
    padding: '8px 12px',
    fontSize: '0.9rem',
    color: '#fff',
    backgroundColor: '#FF4D4D',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 12px',
    fontSize: '0.9rem',
    color: '#fff',
    backgroundColor: '#6c757d',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  commentsSection: {
    marginTop: '15px',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '5px',
  },
  commentsContainer: {
    maxHeight: '150px',
    overflowY: 'auto',
    marginBottom: '10px',
  },
  comment: {
    fontSize: '0.9rem',
    color: '#555',
    marginBottom: '5px',
  },
  commentTime: {
    fontSize: '0.8rem',
    color: '#888',
    marginTop: '-5px',
  },
  noComments: {
    fontSize: '0.9rem',
    color: '#888',
  },
  textarea: {
    width: '100%',
    height: '60px',
    padding: '10px',
    marginBottom: '10px',
    fontSize: '0.9rem',
    border: '1px solid #ddd',
    borderRadius: '5px',
    outline: 'none',
    resize: 'none',
  },
};

export default MyPost;