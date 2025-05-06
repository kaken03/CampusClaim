import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import NavbarHome from '../components/NavbarHome';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './Notification.css';

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    if (!user) return;

    // Query posts where the current user is the author
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('authorId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Collect notifications for comments on the user's posts
      const newNotifications = [];
      userPosts.forEach((post) => {
        if (post.comments && post.comments.length > 0) {
          post.comments.forEach((comment) => {
            newNotifications.push({
              postId: post.id,
              postText: post.text,
              comment,
            });
          });
        }
      });

      setNotifications(newNotifications);
    });

    return () => unsubscribe(); // Clean up listener
  }, [user]);

  const handleNotificationClick = (postId) => {
    // Navigate to the post's detailed view
    navigate(`/post/${postId}`);
  };

  return (
    <div className="notification-page">
      <NavbarHome />
      <div className="notification-container">
        <h1>Your Notifications</h1>
        <div style={styles.notificationBox}>
          {notifications.length > 0 ? (
            <ul className="notification-list">
              {notifications.map((notification, index) => (
                <li
                  key={index}
                  className="notification-item"
                  onClick={() => handleNotificationClick(notification.postId)} // Navigate on click
                >
                  <p>
                    <strong>New comment on your post:</strong> "{notification.postText}"
                  </p>
                  <p className="notification-comment">{notification.comment}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-notifications">No new notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  notificationBox: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  },
};

export default Notification;