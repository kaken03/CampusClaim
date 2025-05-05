import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import CommentSection from './CommentSection';


function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState('');
  const auth = getAuth();

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deleteDoc(doc(db, 'posts', postId));
    }
  };

  const handleEdit = (postId, currentText) => {
    setEditingPostId(postId);
    setEditText(currentText);
  };

  const handleSave = async (postId) => {
    await updateDoc(doc(db, 'posts', postId), { text: editText });
    setEditingPostId(null);
    setEditText('');
  };

  return (
    <div style={styles.feed}>
      {posts.map(post => {
        const isAuthor = auth.currentUser?.uid === post.authorId;

        return (
          <div key={post.id} style={styles.postCard}>
            <p style={styles.author}><strong>{post.authorName}</strong> posted:</p>

            {post.imageUrl && <img src={post.imageUrl} alt="Post" style={styles.image} />}

            {editingPostId === post.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={styles.textarea}
                />
                <button onClick={() => handleSave(post.id)} style={styles.save}>Save</button>
                <button onClick={() => setEditingPostId(null)} style={styles.cancel}>Cancel</button>
              </>
            ) : (
              <p style={styles.text}>{post.text}</p>
            )}

            <p style={styles.date}>
              {post.createdAt?.toDate().toLocaleString()}
            </p>

            {isAuthor && editingPostId !== post.id && (
              <div style={styles.actions}>
                <button
                  onClick={() => handleEdit(post.id, post.text)}
                  style={styles.edit}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  style={styles.delete}
                >
                  Delete
                </button>
              </div>
            )}
            <CommentSection postId={post.id} />

          </div>
        );
      })}
    </div>
  );
}

const styles = {
  feed: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px'
  },
  author: {
    fontSize: '0.9rem',
    color: '#333',
    marginBottom: '5px'
  },
  postCard: {
    background: '#fff',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  image: {
    width: '100%',
    borderRadius: '8px'
  },
  text: {
    fontSize: '1rem',
    margin: '10px 0'
  },
  textarea: {
    width: '100%',
    height: '80px',
    padding: '10px',
    marginBottom: '10px'
  },
  date: {
    fontSize: '0.8rem',
    color: '#888'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  edit: {
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  delete: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  save: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    marginTop: '10px',
    cursor: 'pointer'
  },
  cancel: {
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    marginLeft: '10px',
    cursor: 'pointer'
  }
};

export default PostFeed;
