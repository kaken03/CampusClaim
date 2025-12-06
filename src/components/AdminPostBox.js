import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faImage } from '@fortawesome/free-solid-svg-icons';
import './PostBox.css';

function AdminPostBox({ schoolName }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const auth = getAuth();

  // 🔥 FIX #1 — file input ref
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setSelectedFileName(file ? file.name : '');
  };

  // 🔥 FIX #1 — now resets input value so same image can be selected again
  const clearImage = () => {
    setImage(null);
    setSelectedFileName('');

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!category) {
      console.error('Please select an item category.');
      return;
    }
    setLoading(true);

    try {
      let imageUrl = '';
      if (image) {
        const uploadResult = await uploadToCloudinary(image);
        if (!uploadResult || !uploadResult.secure_url) {
          throw new Error('Image upload failed. No secure URL returned from Cloudinary.');
        }
        imageUrl = uploadResult.secure_url;
      }

      const postUser = auth.currentUser;
      const authorName = postUser?.displayName || 'Lost & Found Staff';
      const authorId = postUser?.uid || null;

      await addDoc(collection(db, 'schools', schoolName, 'FoundItems'), {
        text,
        imageUrl,
        createdAt: serverTimestamp(),
        authorName,
        authorId,
        type: 'found',
        school: schoolName,
        claimed: false,
        category,
        description,
      });

      setText('');
      setImage(null);
      setSelectedFileName('');
      setCategory('');
      setDescription('');
      setIsExpanded(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err) {
      console.error('Post error:', err);
      console.error(`Failed to post. Reason: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const itemCategories = [
    "Cellphone", "Tablet", "Laptop", "Bag/Backpack", "Keys", "Watch",
    "Wallet/Purse", "ID Card/Student Card", "Umbrella", "Book/Notebook",
    "Calculator", "Earphones/Headphones", "Charger/Powerbank",
    "Clothing (Jacket, Hoodie, etc.)", "Shoes/Slippers", "Eyeglasses",
    "Water Bottle", "Sports Equipment", "USB/Flash Drive", "Other"
  ];

  return (
    <div className="ui-post-box-container">
      {isExpanded ? (
        <div className="ui-post-box">
          <button onClick={() => setIsExpanded(false)} className="ui-close-btn">
            <FontAwesomeIcon icon={faTimes} />
          </button>

          <div className="ui-post-box-header">
            <h2 className="ui-post-box-title">Post a Found Item</h2>
          </div>

          <div className="ui-post-box-form">
            <form onSubmit={handlePost}>

              <div className="ui-category-group">
                <label className="ui-category-label">
                  Item Category<span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  className="ui-category-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {itemCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
              </div>

              <textarea
                className="ui-post-box-textarea"
                placeholder="Any other details about the found item..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading}
              />

              <div className="ui-post-box-actions-admin">
                <div className="ui-file-upload-container">
                  <label htmlFor="file-upload" className="ui-custom-file-upload-btn">
                    <FontAwesomeIcon icon={faImage} />
                    <span>&nbsp;{selectedFileName || "Choose Image"}</span>
                  </label>

                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading}
                    ref={fileInputRef}   // 🔥 FIX #1
                  />

                  {image && (
                    <button className="ui-clear-image-btn" onClick={clearImage} disabled={loading}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </div>

              <button
                className="ui-post-box-button"
                type="submit"
                disabled={loading || !category}
              >
                {loading ? 'Posting...' : 'Post Found Item'}
              </button>

            </form>
          </div>
        </div>
      ) : (
        <div className="ui-minimized-post-box" onClick={() => setIsExpanded(true)}>
          <button className="ui-minimized-post-box-btn">What did you found?</button>
        </div>
      )}
    </div>
  );
}

export default AdminPostBox;
