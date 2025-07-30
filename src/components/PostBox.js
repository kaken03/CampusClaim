import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import './PostBox.css'; // Ensure this CSS file is used for PostBox

function PostBox({ schoolName }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false); // New state for anonymity
  const [selectedFileName, setSelectedFileName] = useState(''); // State for displaying file name

  const auth = getAuth();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setSelectedFileName(file ? file.name : ''); // Update file name for display
  };

  const handlePost = async () => {
    if (!text.trim() && !image) {
      alert('Please provide a description or photo for your lost item.');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      let imageUrl = '';
      if (image) {
        // Assume uploadToCloudinary now accepts a progress callback if you want real-time updates
        // For simplicity, we'll just set it to 100% after upload for this example
        imageUrl = await uploadToCloudinary(image);
        setProgress(100);
      }

      const user = auth.currentUser;
      const authorName = isAnonymous ? 'Anonymous' : (user?.displayName || 'Anonymous'); // Use displayName if not anonymous
      const authorId = user?.uid || null;

      await addDoc(collection(db, 'schools', schoolName, 'LostItems'), {
        text,
        imageUrl,
        createdAt: serverTimestamp(),
        authorName: authorName, // Use the determined author name
        authorId: authorId,
        type: 'lost', // Explicitly setting type as 'lost'
        school: schoolName,
        isAnonymous: isAnonymous, // Save the anonymity preference
      });

      // Reset form
      setText('');
      setImage(null);
      setSelectedFileName(''); // Clear displayed file name
      setIsAnonymous(false); // Reset anonymity checkbox
      alert('Lost item posted! Good luck finding your item.');
    } catch (err) {
      console.error('Post error:', err);
      alert('Failed to post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-box-container">
      <h2 className="post-box-title">Report a Lost Item</h2>

      <p className="post-box-educate-message">
        <span role="img" aria-label="info" className="info-icon">ℹ️</span>
        <b>Did you find something?</b> Please bring all found items directly to the <b className="highlight-text">Lost &amp; Found Office</b>.<br />
        <span className="post-box-office-line">
          Only Lost &amp; Found staff are allowed to post found items for everyone's safety and security.
        </span>
      </p>

      <textarea
        className="post-box-textarea"
        placeholder="Describe your lost item in detail (color, brand, model, where you lost it, etc.)..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />

      {/* File Input */}
      <div className="post-box-file-upload-section">
        <label htmlFor="file-upload" className="custom-file-upload-btn">
          Choose Image
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*" // Restrict to image files
          onChange={handleFileChange}
          disabled={loading}
        />
        <span className="file-name-display">{selectedFileName || 'No file chosen'}</span>
        {image && (
          <button className="clear-image-btn" onClick={() => {setImage(null); setSelectedFileName('');}}>X</button>
        )}
      </div>


      {loading && image && (
        <div className="post-box-progress-container">
          <p className="post-box-progress-text">Uploading: {Math.round(progress)}%</p>
          <div className="post-box-progress-bar">
            <div
              className="post-box-progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Anonymous Checkbox */}
      <div className="post-box-anon-option">
        <input
          type="checkbox"
          id="anonymous-post"
          className="custom-checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          disabled={loading}
        />
        <label htmlFor="anonymous-post" className="checkbox-label-text">Post Anonymously</label>
      </div>

      <button
        className="post-box-button"
        onClick={handlePost}
        disabled={loading}
      >
        {loading ? 'Posting...' : 'Post Lost Item'}
      </button>
    </div>
  );
}

export default PostBox;