import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

function PostBox() {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [postType, setPostType] = useState('lost'); // Default to "Lost Item"
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  const handlePost = async () => {
    if (!text.trim() && !image) return;

    setLoading(true);

    try {
      let imageUrl = '';
      if (image) {
        const imageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const user = auth.currentUser;
      const displayName = user?.displayName || 'Anonymous';

      // Determine the collection based on the post type
      const collectionName = postType === 'lost' ? 'LostItems' : 'FoundItems';

      await addDoc(collection(db, collectionName), {
        text,
        imageUrl,
        createdAt: serverTimestamp(),
        authorName: displayName,
        authorId: user?.uid,
        type: postType, // Include the type of post
      });

      setText('');
      setImage(null);
      setPostType('lost'); // Reset to default
      alert('Post submitted!');
    } catch (err) {
      console.error('Post error:', err);
      alert('Failed to post. Try again.');
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create a Post</h2>
      <textarea
        placeholder="Describe the lost or found item..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={styles.textarea}
        disabled={loading}
      />
      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        disabled={loading}
        style={styles.fileInput}
      />
      <div style={styles.radioGroup}>
        <label style={styles.radioLabel}>
          <input
            type="radio"
            value="lost"
            checked={postType === 'lost'}
            onChange={(e) => setPostType(e.target.value)}
            disabled={loading}
            style={styles.radioInput}
          />
          Lost Item
        </label>
        <label style={styles.radioLabel}>
          <input
            type="radio"
            value="found"
            checked={postType === 'found'}
            onChange={(e) => setPostType(e.target.value)}
            disabled={loading}
            style={styles.radioInput}
          />
          Found Item
        </label>
      </div>
      <button onClick={handlePost} style={styles.button} disabled={loading}>
        {loading ? 'Posting...' : 'Post'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    fontSize: '1.5rem',
    color: '#333',
    marginBottom: '15px',
    textAlign: 'center',
  },
  textarea: {
    width: '100%',
    height: '120px',
    padding: '12px',
    marginBottom: '15px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    resize: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
    transition: 'border-color 0.3s ease',
  },
  fileInput: {
    display: 'block',
    marginBottom: '15px',
    fontSize: '1rem',
  },
  radioGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  radioLabel: {
    fontSize: '1rem',
    color: '#333',
  },
  radioInput: {
    marginRight: '8px',
  },
  button: {
    display: 'block',
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    color: '#fff',
    backgroundColor: '#007BFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};

export default PostBox;