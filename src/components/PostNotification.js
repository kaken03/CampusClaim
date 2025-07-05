import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase'; // Adjust the path if the firebase.js file is in a different directory
import { useNavigate } from 'react-router-dom'; // For navigation
import empty from '../assets/icons/empty.png'; // Adjust the path to your empty state icon

function PostNotification() {
  const [notifications, setNotifications] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const timeAgo = (timestamp) => {
    const now = new Date();
    const timeDiff = now - new Date(timestamp);

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

    const fetchNotifications = (collectionName) => {
      const postsRef = collection(db, collectionName);
      const q = query(postsRef, where('authorId', '==', user.uid));

      return onSnapshot(q, (snapshot) => {
        const userPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const newNotifications = [];
        userPosts.forEach((post) => {
          if (post.comments && post.comments.length > 0) {
            const latestComment = post.comments[post.comments.length - 1]; // Get the latest comment
            newNotifications.push({
              notificationId: `${post.id}-${collectionName}`, // Unique notification ID per post
              postId: post.id,
              postText: post.text,
              latestCommentText: latestComment.text,
              latestCommentAuthor: latestComment.author,
              latestTimestamp: latestComment.timestamp,
              commentCount: post.comments.length, // Total number of comments
              collectionName,
            });
          }
        });

        setNotifications((prevNotifications) => {
          const mergedNotifications = [
            ...prevNotifications.filter((n) => n.collectionName !== collectionName),
            ...newNotifications,
          ];

          return mergedNotifications.sort((a, b) => {
            const timeA = new Date(a.latestTimestamp.toDate());
            const timeB = new Date(b.latestTimestamp.toDate());
            return timeB - timeA;
          });
        });
      });
    };

    const unsubscribeLostItems = fetchNotifications('LostItems');
    const unsubscribeFoundItems = fetchNotifications('FoundItems');

    return () => {
      unsubscribeLostItems();
      unsubscribeFoundItems();
    };
  }, [user]);

  const handleNotificationClick = (postId, collectionName) => {
    // Navigate to Home.js with query parameters for postId and collectionName
    navigate(`/home?postId=${postId}&collection=${collectionName}`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Notifications</h2>
      {notifications.length > 0 ? (
        <ul style={styles.notificationList}>
          {notifications.map((notification, index) => (
            <li
              key={index}
              style={styles.notificationItem}
              onClick={() =>
                handleNotificationClick(notification.postId, notification.collectionName)
              }
              role="button"
              tabIndex={0}
            >
              <div style={styles.notificationContent}>
                <p style={styles.notificationText}>
                  <strong>New activity on your post:</strong> "{notification.postText}"{' '}
                  <span
                    style={{
                      ...styles.tag,
                      backgroundColor:
                        notification.collectionName === 'LostItems' ? '#FF4D4D' : '#1877F2',
                    }}
                  >
                    {notification.collectionName === 'LostItems' ? 'Lost Item' : 'Found Item'}
                  </span>
                </p>
                <p style={styles.commentText}>
                  <strong>Latest comment by {notification.latestCommentAuthor}:</strong>{' '}
                  {notification.latestCommentText}
                </p>
                <p style={styles.metaText}>
                  <strong>Total comments:</strong> {notification.commentCount}
                </p>
                <p style={styles.timeText}>
                  {notification.latestTimestamp
                    ? timeAgo(notification.latestTimestamp.toDate())
                    : 'Just now'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div style={styles.emptyState}>
          <img
            src= {empty}
            alt="No notifications"
            style={styles.emptyStateIcon}
          />
          <p style={styles.noNotifications}>No new activity on your posts.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  header: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#1d3557',
    textAlign: 'center',
    marginBottom: '20px',
  },
  notificationList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  notificationItem: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  notificationContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  notificationText: {
    fontSize: '1rem',
    color: '#333',
    marginBottom: '10px',
  },
  tag: {
    display: 'inline-block',
    padding: '3px 8px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#fff',
    borderRadius: '5px',
    marginLeft: '5px',
  },
  commentText: {
    fontSize: '0.9rem',
    color: '#555',
    marginBottom: '8px',
  },
  metaText: {
    fontSize: '0.9rem',
    color: '#777',
    marginBottom: '8px',
  },
  timeText: {
    fontSize: '0.8rem',
    color: '#999',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    width: '100px',
    height: '100px',
    marginBottom: '10px',
  },
  noNotifications: {
    fontSize: '1rem',
    textAlign: 'center',
    color: '#777',
  },
};

export default PostNotification;