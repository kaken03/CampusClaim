import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { uploadToCloudinary } from '../utils/uploadToCloudinary'; // ✅ Use the external one

function PostBox() {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [postType, setPostType] = useState('lost');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const auth = getAuth();

  const handlePost = async () => {
    if (!text.trim() && !image) return;

    setLoading(true);
    setProgress(0);

    try {
      let imageUrl = '';

      if (image) {
        const uploadStart = Date.now();
        imageUrl = await uploadToCloudinary(image); // ✅ Using external utility

        const uploadDuration = Date.now() - uploadStart;
        setProgress(100);
        console.log('Image uploaded in', uploadDuration, 'ms:', imageUrl);
      }

      const user = auth.currentUser;
      const displayName = user?.displayName || 'Anonymous';
      const collectionName = postType === 'lost' ? 'LostItems' : 'FoundItems';

      await addDoc(collection(db, collectionName), {
        text,
        imageUrl,
        createdAt: serverTimestamp(),
        authorName: displayName,
        authorId: user?.uid,
        type: postType,
      });

      setText('');
      setImage(null);
      setPostType('lost');
      alert('Post submitted!');
    } catch (err) {
      console.error('Post error:', err);
      alert('Failed to post. Try again.');
    } finally {
      setLoading(false);
    }
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
      {loading && image && (
        <div style={styles.progressContainer}>
          <p style={styles.progressText}>Uploading: {Math.round(progress)}%</p>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }}></div>
          </div>
        </div>
      )}
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
    width: '95%',
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
    width: '95%',
  },
  progressContainer: {
    marginBottom: '15px',
  },
  progressText: {
    fontSize: '0.9rem',
    marginBottom: '5px',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007BFF',
    transition: 'width 0.4s ease',
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
    background: '#1d3557',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};

export default PostBox;
