import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc, onSnapshot, query, where, getDocs, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import './Notification.css';
import NavbarHome from '../components/NavbarHome';
import { FaCommentDots } from "react-icons/fa";

export default function PostNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribePosts = null;
    let unsubscribed = false;

    const fetchUserAndListen = async (user) => {
      if (!user) return;
      let schoolName = localStorage.getItem('schoolName');
      if (!schoolName) {
        const schoolList = ["Consolatrix College of Toledo City"];
        for (const school of schoolList) {
          const userDoc = await getDoc(doc(db, "schools", school, "users", user.uid));
          if (userDoc.exists()) {
            schoolName = school;
            localStorage.setItem('schoolName', schoolName);
            break;
          }
        }
      }
      if (!schoolName) {
        setLoading(false);
        return;
      }
      const postsRef = collection(db, "schools", schoolName, "LostItems");
      const postsQuery = query(postsRef, where("authorId", "==", user.uid));
      unsubscribePosts = onSnapshot(postsQuery, async (snapshot) => {
        let newNotifications = [];
        const promises = snapshot.docs.map(async (docSnap) => {
          const post = docSnap.data();
          const postId = docSnap.id;
          const commentsRef = collection(db, "schools", schoolName, "LostItems", postId, "comments");
          const commentsQuery = query(commentsRef, orderBy("timestamp", "asc"));
          const commentsSnap = await getDocs(commentsQuery);
          const otherComments = commentsSnap.docs
            .map(c => c.data())
            .filter(c => c.authorId !== user.uid);
          if (otherComments.length > 0) {
            const latestComment = otherComments[otherComments.length - 1];
            newNotifications.push({
              id: postId,
              postId: postId,
              postText: post.text || "(no text)",
              latestCommentText: latestComment.text,
              latestCommentAuthor: latestComment.author || "Someone",
              commentCount: otherComments.length,
              timestamp: latestComment.timestamp,
              schoolName: schoolName,
            });
          }
        });
        await Promise.all(promises);
        newNotifications.sort(
          (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
        );
        if (!unsubscribed) {
          setNotifications(newNotifications);
          setLoading(false);
        }
      });
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) fetchUserAndListen(user);
      else setLoading(false);
    });

    return () => {
      unsubscribed = true;
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
    <div className="notification-page-bg">
      <NavbarHome />
      <div className="notification-main-card">
        {loading ? (
          <p className="loading">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="no-notifications">No new notifications</p>
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <li
                key={n.id + n.timestamp?.seconds}
                className="notification-card"
                onClick={() => navigate(`/timeline?postId=${n.postId}&school=${encodeURIComponent(n.schoolName)}`)}
              >
                <div className="notification-icon">
                  <FaCommentDots size={28} color="#2c3e50" />
                </div>
                <div className="notification-content">
                  <span className="notification-author">{n.latestCommentAuthor}</span>
                  <span className="notification-text">
                    commented on your post <span className="notification-post">"{n.postText.substring(0, 30)}..."</span>
                    {n.commentCount > 1 && (
                      <span className="more-comments">
                        (+{n.commentCount - 1} more)
                      </span>
                    )}
                  </span>
                  <span className="notification-timestamp">{timeAgo(n.timestamp)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}