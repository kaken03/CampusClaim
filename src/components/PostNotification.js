import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import './PostNotification.css';
import { useNavigate } from 'react-router-dom';

export default function PostNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe = null;

    const fetchUserAndListen = async (user) => {
      if (!user) return;

      // Get the user's school
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.error("User profile not found in Firestore!");
        return;
      }

      const userData = userDoc.data();
      const schoolName = userData.school;

      // Listen to posts in the school
      const postsRef = collection(db, "schools", schoolName, "LostItems");

      unsubscribe = onSnapshot(postsRef, (snapshot) => {
  let newNotifications = [];

  snapshot.forEach((docSnap) => {
    const post = docSnap.data();

    if (post.authorId !== user.uid) return;

    if (Array.isArray(post.comments) && post.comments.length > 0) {
      const otherComments = post.comments.filter(
        (c) => c.authorId !== user.uid
      );

      if (otherComments.length > 0) {
        const latestComment = otherComments[otherComments.length - 1];

        newNotifications.push({
          id: docSnap.id,
          postId: docSnap.id,
          postText: post.text || "(no text)",
          latestCommentText: latestComment.text,
          latestCommentAuthor: latestComment.author || "Someone",
          commentCount: otherComments.length,
          timestamp: latestComment.timestamp,
          schoolName: schoolName, // make sure you pass this too
        });
      }
    }
  });

  // Sort by latest
  newNotifications.sort(
    (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
  );

  setNotifications(newNotifications);

  // ✅ Always stop loading, even if no notifications
  setLoading(false);
});

    };

    // Wait for auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) fetchUserAndListen(user);
      else setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribe) unsubscribe();
    };
  }, [auth]);

  const timeAgo = (timestamp) => {
    if (!timestamp) return "just now";
    const now = new Date();
    const time =
      timestamp.toDate?.() ||
      new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  

  return (
    <div className="post-notifications">
      {loading ? (
        <p className="loading">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="no-notifications">No new notifications</p>
      ) : (
         <ul>
    {notifications.map((n) => (
      <li
        key={n.id}
        className="notification-item"
        onClick={() => navigate(`/timeline?postId=${n.postId}&school=${encodeURIComponent(n.schoolName)}`)}
        style={{ cursor: 'pointer' }}
      >
        <strong>{n.latestCommentAuthor}</strong> commented on your post "
        {n.postText.substring(0, 30)}..."
        {n.commentCount > 1 && (
          <span className="more-comments">
            (+{n.commentCount - 1} more)
          </span>
        )}
        <span className="timestamp"> ({timeAgo(n.timestamp)})</span>
      </li>
    ))}
  </ul>
      )}
    </div>
  );
}
