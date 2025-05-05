import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // your firebase config file
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('lost'); // Default to "Lost Items"
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState('');
  const [commentText, setCommentText] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const collectionName = category === 'lost' ? 'LostItems' : 'FoundItems';
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe(); // Clean up listener
  }, [category]);

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

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;

    const postRef = doc(db, category === 'lost' ? 'LostItems' : 'FoundItems', postId);
    const post = posts.find((p) => p.id === postId);

    // Add the user's full name to the comment
    const userName = user?.displayName || 'Anonymous';
    const updatedComments = [...(post.comments || []), `${userName}: ${commentText}`];

    await updateDoc(postRef, { comments: updatedComments });
    setCommentText('');
    alert('Comment added!');
  };

  return (
    <div style={styles.feed}>
      <h2 style={styles.title}>Posts</h2>
      <div style={styles.categorySelector}>
        <button
          onClick={() => setCategory('lost')}
          style={category === 'lost' ? styles.activeCategoryButton : styles.categoryButton}
        >
          Lost Items
        </button>
        <button
          onClick={() => setCategory('found')}
          style={category === 'found' ? styles.activeCategoryButton : styles.categoryButton}
        >
          Found Items
        </button>
      </div>
      {posts.map((post) => (
        <div key={post.id} style={styles.postCard}>
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
          {post.authorId === user?.uid && ( // Only show edit and delete buttons if the user is the author
            <div style={styles.actions}>
              <button onClick={() => setEditingPostId(post.id)} style={styles.button}>
                Edit
              </button>
              <button onClick={() => handleDelete(post.id)} style={styles.deleteButton}>
                Delete
              </button>
            </div>
          )}
          <div style={styles.commentsSection}>
            <h4>Comments:</h4>
            <div style={styles.commentsContainer}>
              {post.comments?.length > 0 ? (
                post.comments.map((comment, index) => (
                  <p key={index} style={styles.comment}>
                    {comment}
                  </p>
                ))
              ) : (
                <p style={styles.noComments}>No comments yet.</p>
              )}
            </div>
            <textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={styles.textarea}
            />
            <button onClick={() => handleAddComment(post.id)} style={styles.button}>
              Add Comment
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  feed: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  title: {
    fontSize: '1.8rem',
    color: '#333',
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
    color: '#fff',
    backgroundColor: '#007BFF',
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
    transition: 'background-color 0.3s ease',
  },
  cancelButton: {
    padding: '8px 12px',
    fontSize: '0.9rem',
    color: '#fff',
    backgroundColor: '#6c757d',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  commentsSection: {
    marginTop: '15px',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '5px',
  },
  commentsContainer: {
    maxHeight: '150px', // Set a fixed height for the comments section
    overflowY: 'auto', // Enable vertical scrolling
    marginBottom: '10px',
  },
  comment: {
    fontSize: '0.9rem',
    color: '#555',
    marginBottom: '5px',
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

export default PostFeed;