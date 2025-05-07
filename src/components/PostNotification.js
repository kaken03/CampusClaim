import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase'; // Adjust the path if the firebase.js file is in a different directory

function PostNotification() {
  const [notifications, setNotifications] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;

  // Utility function to calculate "time ago"
  const timeAgo = (timestamp) => {
    const now = new Date();
    const timeDiff = now - new Date(timestamp); // Difference in milliseconds

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${weeks}w ago`;
  };

  useEffect(() => {
    if (!user) return;

    // Function to fetch notifications from a specific collection
    const fetchNotifications = (collectionName) => {
      const postsRef = collection(db, collectionName);
      const q = query(postsRef, where('authorId', '==', user.uid));

      return onSnapshot(q, (snapshot) => {
        const userPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Collect notifications for comments on the user's posts
        const newNotifications = [];
        userPosts.forEach((post) => {
          if (post.comments && post.comments.length > 0) {
            post.comments.forEach((comment) => {
              // Only notify if the comment was made by another user
              if (comment.authorId !== user.uid) {
                newNotifications.push({
                  postId: post.id,
                  postText: post.text,
                  commentText: comment.text, // Comment text
                  commentAuthor: comment.author, // Comment author
                  timestamp: comment.timestamp, // Comment timestamp
                  collectionName, // Add collection name for navigation
                });
              }
            });
          }
        });

        // Merge notifications, sort by timestamp in descending order (newest first)
        setNotifications((prevNotifications) => {
          const mergedNotifications = [
            ...prevNotifications.filter((n) => n.collectionName !== collectionName),
            ...newNotifications,
          ];

          return mergedNotifications.sort((a, b) => {
            const timeA = new Date(a.timestamp.toDate());
            const timeB = new Date(b.timestamp.toDate());
            return timeB - timeA; // Newest first
          });
        });
      });
    };

    // Listen to both LostItems and FoundItems collections
    const unsubscribeLostItems = fetchNotifications('LostItems');
    const unsubscribeFoundItems = fetchNotifications('FoundItems');

    return () => {
      unsubscribeLostItems();
      unsubscribeFoundItems();
    }; // Clean up listeners
  }, [user]);

  return (
    <div className="post-notification-container">
      {notifications.length > 0 ? (
        <ul className="post-notification-list">
          {notifications.map((notification, index) => (
            <li key={index} className="post-notification-item">
              <p>
                <strong>New comment on your post:</strong> "{notification.postText}"{' '}
                <span
                  style={{
                    color: notification.collectionName === 'LostItems' ? '#FF4D4D' : '#1877F2',
                    fontWeight: 'bold',
                  }}
                >
                  ({notification.collectionName === 'LostItems' ? 'Lost Item' : 'Found Item'})
                </span>
              </p>
              <p>
                <strong>{notification.commentAuthor}:</strong> {notification.commentText}
              </p>
              <p className="post-notification-time">
                {notification.timestamp ? timeAgo(notification.timestamp.toDate()) : 'Just now'}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-post-notifications">No new comments on your posts.</p>
      )}
    </div>
  );
}

export default PostNotification;