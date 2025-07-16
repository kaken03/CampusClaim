import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import empty from '../assets/icons/empty.png';

function PostNotification() {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState({});
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

  // Fetch read notification IDs for this user
  useEffect(() => {
    if (!user) return;
    const fetchReadIds = async () => {
      const readNotificationsRef = collection(db, 'users', user.uid, 'readNotifications');
      const querySnapshot = await getDocs(readNotificationsRef);
      const ids = {};
      querySnapshot.forEach(docSnap => {
        ids[docSnap.id] = docSnap.data().readAt;
      });
      setReadIds(ids);
    };
    fetchReadIds();
  }, [user]);

  // Fetch notifications for user's posts
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
            const latestComment = post.comments[post.comments.length - 1];
            const notificationId = `${post.id}-${collectionName}`;

            newNotifications.push({
              notificationId,
              postId: post.id,
              postText: post.text,
              latestCommentText: latestComment.text,
              latestCommentAuthor: latestComment.author,
              latestTimestamp: latestComment.timestamp,
              commentCount: post.comments.length,
              collectionName,
              isRead: !!readIds[notificationId],
            });
          }
        });

        setNotifications((prevNotifications) => {
          // Remove previous notifications for this collection
          const filteredPrev = prevNotifications.filter(
            (n) => n.collectionName !== collectionName
          );
          // Merge and sort by latest timestamp
          const mergedNotifications = [
            ...filteredPrev,
            ...newNotifications,
          ].sort((a, b) => {
            const timeA = new Date(
              a.latestTimestamp?.toDate
                ? a.latestTimestamp.toDate()
                : a.latestTimestamp
            );
            const timeB = new Date(
              b.latestTimestamp?.toDate
                ? b.latestTimestamp.toDate()
                : b.latestTimestamp
            );
            return timeB - timeA;
          });
          return mergedNotifications;
        });
      });
    };

    const unsubscribeLostItems = fetchNotifications('LostItems');
    const unsubscribeFoundItems = fetchNotifications('FoundItems');

    return () => {
      unsubscribeLostItems();
      unsubscribeFoundItems();
    };
  }, [user, readIds]);

  // Mark notification as read in Firestore and navigate
  const handleNotificationClick = async (postId, collectionName, notificationId, isRead) => {
    if (!user) return;
    if (!isRead) {
      await setDoc(
        doc(db, 'users', user.uid, 'readNotifications', notificationId),
        { readAt: new Date() }
      );
      setReadIds((prev) => ({
        ...prev,
        [notificationId]: new Date(),
      }));
    }
    navigate(`/home?postId=${postId}&collection=${collectionName}`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Notifications</h2>
      {notifications.length > 0 ? (
        <ul style={styles.notificationList}>
          {notifications.map((notification, index) => (
            <li
              key={notification.notificationId}
              style={styles.notificationItem(notification.isRead)}
              onClick={() =>
                handleNotificationClick(
                  notification.postId,
                  notification.collectionName,
                  notification.notificationId,
                  notification.isRead
                )
              }
              role="button"
              tabIndex={0}
            >
              <div style={styles.notificationContent}>
                <p style={styles.notificationText}>
                  {/* Badge (unreadDot) removed as requested */}
                  <strong>New activity on your post:</strong> "{notification.postText}"{' '}
                  <span
                    style={{
                      ...styles.tag,
                      backgroundColor:
                        notification.collectionName === 'LostItems'
                          ? '#FF4D4D'
                          : '#1877F2',
                    }}
                  >
                    {notification.collectionName === 'LostItems'
                      ? 'Lost Item'
                      : 'Found Item'}
                  </span>
                </p>
                <p style={styles.commentText}>
                  <strong>
                    Latest comment by {notification.latestCommentAuthor}:
                  </strong>{' '}
                  {notification.latestCommentText}
                </p>
                <p style={styles.metaText}>
                  <strong>Total comments:</strong> {notification.commentCount}
                </p>
                <p style={styles.timeText}>
                  {notification.latestTimestamp
                    ? timeAgo(
                        notification.latestTimestamp.toDate
                          ? notification.latestTimestamp.toDate()
                          : notification.latestTimestamp
                      )
                    : 'Just now'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div style={styles.emptyState}>
          <img src={empty} alt="No notifications" style={styles.emptyStateIcon} />
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
  notificationItem: (isRead) => ({
    backgroundColor: isRead ? '#fff' : '#e3f0ff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }),
  notificationContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  notificationText: {
    fontSize: '1rem',
    color: '#333',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  // unreadDot style removed
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