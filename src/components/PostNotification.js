import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc, onSnapshot, query, where, getDocs} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import './PostNotification.css';
import { useNavigate } from 'react-router-dom';

export default function PostNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribePosts = null;

    const fetchUserAndListen = async (user) => {
      if (!user) return;

      // Get the user's school from localStorage or another reliable source
      const schoolName = localStorage.getItem('schoolName');
      if (!schoolName) {
        console.error("School name not found for user!");
        setLoading(false);
        return;
      }

      // Get the user's profile from the correct path
      const userDoc = await getDoc(doc(db, "schools", schoolName, "users", user.uid));
      // const userDoc = await getDoc(doc(db, "users", user.uid)); // Uncomment this line if using a top-level users collection
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const schoolName = userData.school;

        // Listen to posts in the school authored by the user
        const postsRef = collection(db, "schools", schoolName, "LostItems");
        const postsQuery = query(postsRef, where("authorId", "==", user.uid));
        unsubscribePosts = onSnapshot(postsQuery, async (snapshot) => {
          let newNotifications = [];
          for (const docSnap of snapshot.docs) {
            const post = docSnap.data();
            const postId = docSnap.id;
            const commentsRef = collection(db, "schools", schoolName, "LostItems", postId, "comments");
            const commentsSnap = await getDocs(commentsRef);
            for (const commentDoc of commentsSnap.docs) {
              const comment = commentDoc.data();
              console.log("Checking comment:", comment);
              if (comment.authorId !== user.uid) {
                newNotifications.push({
                  id: postId,
                  postId: postId,
                  postText: post.text || "(no text)",
                  latestCommentText: comment.text,
                  latestCommentAuthor: comment.author || "Someone",
                  timestamp: comment.timestamp,
                  schoolName: schoolName,
                });
              }
            }
          }
          setNotifications(newNotifications);
          setLoading(false);
        });
      } else {
        console.error("User profile not found in Firestore!");
        setLoading(false);
      }
    };

    // Wait for auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) fetchUserAndListen(user);
      else setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribePosts) unsubscribePosts();
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
