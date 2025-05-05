import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

function PostBox() {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
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
      const displayName = user?.displayName || "Anonymous";

      await addDoc(collection(db, 'posts'), {
        text,
        imageUrl,
        createdAt: serverTimestamp(),
        authorName: displayName,
        authorId: user?.uid
      });

      setText('');
      setImage(null);
      alert('Post submitted!');
    } catch (err) {
      console.error('Post error:', err);
      alert('Failed to post. Try again.');
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
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
      />
      <button onClick={handlePost} style={styles.button} disabled={loading}>
        {loading ? 'Posting...' : 'Post'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    background: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  textarea: {
    width: '100%',
    height: '100px',
    padding: '10px',
    marginBottom: '10px',
    resize: 'none',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  }
};

export default PostBox;
