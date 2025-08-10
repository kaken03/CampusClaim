import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faTimes, faImage } from '@fortawesome/free-solid-svg-icons';
import './AdminPostBox.css'; // New CSS file for AdminPostBox

// This component is specifically for admins to post found items.
function AdminPostBox({ schoolName }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const auth = getAuth();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setSelectedFileName(file ? file.name : '');
  };

  const clearImage = () => {
    setImage(null);
    setSelectedFileName('');
  };

  const handlePost = async () => {
    if (!text.trim() && !image) {
      // Use a custom modal or message box instead of alert()
      console.error('Please provide a description or photo for the found item.');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      let imageUrl = '';
      if (image) {
        const uploadResult = await uploadToCloudinary(image);
        if (!uploadResult || !uploadResult.secure_url) {
          throw new Error('Image upload failed. No secure URL returned from Cloudinary.');
        }
        imageUrl = uploadResult.secure_url;
        setProgress(100);
      }

      const postUser = auth.currentUser;
      const authorName = postUser?.displayName || 'Lost & Found Staff';
      const authorId = postUser?.uid || null;

      // Posting to a separate 'FoundItems' collection
      await addDoc(collection(db, 'schools', schoolName, 'FoundItems'), {
        text,
        imageUrl,
        createdAt: serverTimestamp(),
        authorName: authorName,
        authorId: authorId,
        type: 'found',
        school: schoolName,
        claimed: false,
      });

      // Reset form
      setText('');
      setImage(null);
      setSelectedFileName('');
      // Use a custom modal or message box instead of alert()
      console.log('Found item posted successfully!');
      setIsExpanded(false); // Minimize the PostBox after a successful post
    } catch (err) {
      console.error('Post error:', err);
      // Use a custom modal or message box instead of alert()
      console.error(`Failed to post. Reason: ${err.message || 'An unknown error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-admin-post-box-container">
      {isExpanded ? (
        // Expanded PostBox
        <div className="ui-admin-post-box">
          <button onClick={() => setIsExpanded(false)} className="ui-close-btn">
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <div className="ui-admin-post-box-header">
            <h2 className="ui-admin-post-box-title">Post a Found Item</h2>
          </div>
          <div className="ui-admin-post-box-form">
            <textarea
              className="ui-admin-post-box-textarea"
              placeholder="Describe the found item in detail..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <div className="ui-admin-post-box-actions">
              <div className="ui-file-upload-container">
                <label htmlFor="file-upload-found" className="ui-custom-file-upload-btn">
                  <FontAwesomeIcon icon={faImage} />
                  <span>&nbsp;{selectedFileName || 'Choose Image'}</span>
                </label>
                <input
                  id="file-upload-found"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                {image && (
                  <button className="ui-clear-image-btn" onClick={clearImage} disabled={loading}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
            </div>
            {loading && (
              <div className="ui-admin-post-box-progress">
                <div
                  className="ui-progress-bar"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
            <button
              className="ui-admin-post-box-button"
              onClick={handlePost}
              disabled={loading || (!text.trim() && !image)}
            >
              {loading ? 'Posting...' : 'Post Found Item'}
            </button>
          </div>
        </div>
      ) : (
        // Minimized "Post" button
        <div className="ui-minimized-admin-post-box" onClick={() => setIsExpanded(true)}>
          <button className="ui-minimized-admin-post-box-btn">
            Post a Found Item
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminPostBox;
