import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faTimes, faImage } from '@fortawesome/free-solid-svg-icons';
import './PostBox.css';

function PostBox({ schoolName }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [isExpanded, setIsExpanded] = useState(false); // New state for expanding/minimizing

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user || !schoolName) return;

    const fetchVerificationStatus = async () => {
      try {
        const userDocRef = doc(db, 'schools', schoolName, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setVerificationStatus(docSnap.data()?.verificationStatus || '');
        } else {
          console.log("User document not found at the specified path.");
          setVerificationStatus('');
        }
      } catch (error) {
        console.error("Error fetching verification status:", error);
        setVerificationStatus('');
      }
    };

    fetchVerificationStatus();
  }, [user, schoolName]);

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
      alert('Please provide a description or photo for your lost item.');
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
      const authorName = isAnonymous ? 'Anonymous' : (postUser?.displayName || 'Anonymous');
      const authorId = postUser?.uid || null;

      await addDoc(collection(db, 'schools', schoolName, 'LostItems'), {
        text,
        imageUrl,
        createdAt: serverTimestamp(),
        authorName: authorName,
        authorId: authorId,
        type: 'lost',
        school: schoolName,
        isAnonymous: isAnonymous,
        claimed: false,
        comments: [],
      });

      // Reset form
      setText('');
      setImage(null);
      setSelectedFileName('');
      setIsAnonymous(false);
      alert('Lost item posted! Good luck finding your item.');
      setIsExpanded(false); // Minimize the PostBox after a successful post
    } catch (err) {
      console.error('Post error:', err);
      alert(`Failed to post. Reason: ${err.message || 'An unknown error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Logic to handle unauthorized users
  if (!user) {
    return (
      <div className="verify-warning">
        <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#e63946', marginRight: 8 }} />
        <span>You must be logged in to post.</span>
      </div>
    );
  }

  if (verificationStatus !== 'verified') {
    return (
      <div className="verify-warning">
        <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#e63946', marginRight: 8 }} />
        <span>You must be verified to post. Please complete verification in your profile.</span>
      </div>
    );
  }

  // Conditional rendering based on isExpanded state
  return (
    <div className="ui-post-box-container">
      {isExpanded ? (
        // Expanded PostBox
        <div className="ui-post-box">
          <button onClick={() => setIsExpanded(false)} className="ui-close-btn">
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <div className="ui-post-box-header">
            <h2 className="ui-post-box-title">Report a Lost Item</h2>
          </div>
          <div className="ui-post-box-info-message">
            <FontAwesomeIcon icon={faInfoCircle} className="ui-info-icon" />
            <p>
              <b>Did you find something?</b> Please bring all found items directly to the{' '}
              <b className="ui-highlight-text">Lost & Found Office</b>.<br />
              Only Lost & Found staff are allowed to post found items for everyone's safety and security.
            </p>
          </div>
          <div className="ui-post-box-form">
            <textarea
              className="ui-post-box-textarea"
              placeholder="Describe your lost item in detail (color, brand, model, where you lost it, etc.)..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <div className="ui-post-box-actions">
              <div className="ui-file-upload-container">
                <label htmlFor="file-upload" className="ui-custom-file-upload-btn">
                  <FontAwesomeIcon icon={faImage} />
                  <span>&nbsp;{selectedFileName || 'Choose Image'}</span>
                </label>
                <input
                  id="file-upload"
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
              <div className="ui-anonymous-option">
                <input
                  type="checkbox"
                  id="anonymous-post"
                  className="ui-custom-checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor="anonymous-post" className="ui-checkbox-label">Post Anonymously</label>
              </div>
            </div>
            {loading && (
              <div className="ui-post-box-progress">
                <div
                  className="ui-progress-bar"
                  style={{ width: `${progress}%` }}
                ></div>
                <span className="ui-progress-text">Uploading...</span>
              </div>
            )}
            <button
              className="ui-post-box-button"
              onClick={handlePost}
              disabled={loading || (!text.trim() && !image)}
            >
              {loading ? 'Posting...' : 'Post Lost Item'}
            </button>
          </div>
        </div>
      ) : (
        // Minimized "Post" button
        <div className="ui-minimized-post-box" onClick={() => setIsExpanded(true)}>
          <button className="ui-minimized-post-box-btn">
            What did you lose?
          </button>
        </div>
      )}
    </div>
  );
}

export default PostBox;