import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInfoCircle,
  faTimes,
  // faImage,
} from "@fortawesome/free-solid-svg-icons";
import "./PostBox.css";

function PostBox({ schoolName }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  // const [selectedFileName, setSelectedFileName] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // ✅ Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const auth = getAuth();

  // ✅ Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  // ✅ Fetch verification status when user changes
  useEffect(() => {
    if (!user || !schoolName) return;

    const fetchVerificationStatus = async () => {
      try {
        const userDocRef = doc(db, "schools", schoolName, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setVerificationStatus(docSnap.data()?.verificationStatus || "");
        } else {
          setVerificationStatus("");
        }
      } catch (error) {
        console.error("Error fetching verification status:", error);
        setVerificationStatus("");
      }
    };

    fetchVerificationStatus();
  }, [user, schoolName]);

  // const handleFileChange = (e) => {
  //   const file = e.target.files[0];
  //   setImage(file);
  //   setSelectedFileName(file ? file.name : "");
  // };

  // const clearImage = () => {
  //   setImage(null);
  //   setSelectedFileName("");
  // };

  const handlePost = async () => {
    if (!user) {
      alert("⚠️ You must be logged in to post.");
      return;
    }

    if (verificationStatus !== "verified") {
       setActionMessage("❌ You must be verified to post. Please complete verification in your profile.");
      setTimeout(() => setActionMessage(''), 2000);
      // alert("❌ You must be verified to post Lost Items. Please complete verification in your profile.");
      return;
    }

    if (!text.trim() && !image) {
      alert("⚠️ Please provide a description or photo for your lost item.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "";
      if (image) {
        const uploadResult = await uploadToCloudinary(image);

        if (!uploadResult || !uploadResult.secure_url) {
          throw new Error("Image upload failed. No secure URL returned from Cloudinary.");
        }

        imageUrl = uploadResult.secure_url;
      }

      const authorName = isAnonymous ? "Anonymous" : user?.displayName || "Anonymous";
      const authorId = user?.uid || null;

      await addDoc(collection(db, "schools", schoolName, "LostItems"), {
        text,
        imageUrl,
        createdAt: serverTimestamp(),
        authorName,
        authorId,
        type: "lost",
        school: schoolName,
        isAnonymous,
        claimed: false,
        comments: [],
      });

      // Reset form
      setText("");
      setImage(null);
      // setSelectedFileName("");
      setIsAnonymous(false);
      setIsExpanded(false);

      setActionMessage("✅ Posted successfully!");
      setTimeout(() => setActionMessage(''), 2000);
    } catch (err) {
      console.error("Post error:", err);
      alert(`⚠️ Failed to post. Reason: ${err.message || "An unknown error occurred."}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading state while restoring session
  if (authLoading) {
    return (
      <div className="verify-warning">
        <FontAwesomeIcon icon={faInfoCircle} style={{ color: "#2c3e50", marginRight: 8 }} />
        <span>Loading...</span>
      </div>
    );
  }

  // ✅ Main UI (always visible now)
  return (
    <div className="ui-post-box-container" style={{ position: "relative" }}>
      {actionMessage && (
        <div className="postbox-action-message">{actionMessage}</div>
      )}
      {isExpanded ? (
        <div className="ui-post-box">
          <button onClick={() => setIsExpanded(false)} className="ui-close-btn" disabled={loading}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <div className="ui-post-box-header">
            <h2 className="ui-post-box-title">Report a Lost Item</h2>
          </div>
          <div className="ui-post-box-info-message">
            <FontAwesomeIcon icon={faInfoCircle} className="ui-info-icon" />
            <p>
              <b>Did you find something?</b> Please bring all found items
              directly to the{" "}
              <b className="ui-highlight-text">Lost & Found Office</b>.<br />
              Only Lost & Found staff are allowed to post found items for
              everyone&apos;s safety and security.
            </p>
          </div>
          <div className="ui-post-box-form">
            <textarea
              className="ui-post-box-textarea"
              placeholder="Describe your lost item (e.g., phone, bag, wallet, last seen location). Keep unique details private."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <div className="ui-post-box-actions">
              {/* <div className="ui-file-upload-container">
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
                />
                {image && (
                  <button className="ui-clear-image-btn" onClick={clearImage} disabled={loading}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div> */}
              <div className="ui-anonymous-option">
                <input
                  type="checkbox"
                  id="anonymous-post"
                  className="ui-custom-checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor="anonymous-post" className="ui-checkbox-label">
                  Post Anonymously
                </label>
              </div>
            </div>
            <button
              className="ui-post-box-button"
              onClick={handlePost}
              disabled={loading || (!text.trim() && !image)}
            >
              {loading ? "Posting..." : "Post Lost Item"}
            </button>
          </div>
        </div>
      ) : (
        <div className="ui-minimized-post-box" onClick={() => setIsExpanded(true)}>
          <button className="ui-minimized-post-box-btn">What did you lose?</button>
        </div>
      )}
    </div>
  );
}

export default PostBox;
