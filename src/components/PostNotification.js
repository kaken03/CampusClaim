import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; // Assuming your firebase.js file exports 'db'
import './PostNotification.css';

/**
 * React component for displaying and managing post-related notifications.
 * It listens for new comments on the user's own posts in two collections: 'LostItems' and 'FoundItems'.
 * It also tracks which notifications have been read by the user using a sub-collection in Firestore.
 */
function PostNotification() {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();

  const auth = getAuth();
  const userRef = useRef(null);

  // Set up authentication listener to get the current user
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      userRef.current = currentUser;
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, [auth]);

  /**
   * Calculates the time difference and returns a human-readable string.
   * @param {Date | {toDate: () => Date}} timestamp - The timestamp to format.
   * @returns {string} The formatted time string (e.g., "5m ago").
   */
  const timeAgo = (timestamp) => {
    let date = timestamp;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    }
    const now = new Date();
    const timeDiff = now - date;

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

  // Fetch read notification IDs and notifications for user's posts
  useEffect(() => {
    if (!isAuthReady || !userRef.current) {
      return;
    }

    const user = userRef.current;
    let unsubscribes = [];

    // Listener for read notification IDs
    const readNotificationsRef = collection(db, 'users', user.uid, 'readNotifications');
    const unsubscribeRead = onSnapshot(readNotificationsRef, (snapshot) => {
      const ids = {};
      snapshot.forEach(docSnap => {
        ids[docSnap.id] = docSnap.data().readAt;
      });
      setReadIds(ids);
    }, (error) => {
      console.error("Error fetching read notifications:", error);
    });

    unsubscribes.push(unsubscribeRead);

    /**
     * Sets up a real-time listener for posts in a specific collection.
     * @param {string} collectionName - The name of the Firestore collection.
     */
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

            // Create a new notification object
            newNotifications.push({
              notificationId,
              postId: post.id,
              postText: post.text,
              latestCommentText: latestComment.text,
              latestCommentAuthor: latestComment.author,
              latestTimestamp: latestComment.timestamp,
              commentCount: post.comments.length,
              collectionName,
            });
          }
        });

        setNotifications((prevNotifications) => {
          // Remove previous notifications for this collection to prevent duplicates
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
      }, (error) => {
        console.error(`Error fetching notifications from ${collectionName}:`, error);
      });
    };

    const unsubscribeLostItems = fetchNotifications('LostItems');
    const unsubscribeFoundItems = fetchNotifications('FoundItems');

    unsubscribes.push(unsubscribeLostItems, unsubscribeFoundItems);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [isAuthReady, readIds]);

  /**
   * Marks a notification as read and navigates to the post.
   * @param {string} postId - The ID of the post.
   * @param {string} collectionName - The collection the post belongs to.
   * @param {string} notificationId - The unique ID of the notification.
   */
  const handleNotificationClick = async (postId, collectionName, notificationId) => {
    if (!userRef.current) return;

    // Check if the notification is already read
    if (!readIds[notificationId]) {
      try {
        await setDoc(
          doc(db, 'users', userRef.current.uid, 'readNotifications', notificationId),
          { readAt: new Date() }
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    navigate(`/home?postId=${postId}&collection=${collectionName}`);
  };

  // SVG icon for the empty state
  const EmptyStateIcon = () => (
    <svg className="empty-state-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.731 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );

  if (!isAuthReady) {
    return (
      <div className="notifications-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <h2 className="notifications-header">Notifications</h2>
      {notifications.length > 0 ? (
        <ul className="notifications-list">
          {notifications.map((notification) => {
            const isRead = !!readIds[notification.notificationId];
            return (
              <li
                key={notification.notificationId}
                className={`notification-item ${isRead ? 'read' : ''}`}
                onClick={() =>
                  handleNotificationClick(
                    notification.postId,
                    notification.collectionName,
                    notification.notificationId
                  )
                }
                role="button"
                tabIndex={0}
              >
                <div className="notification-content">
                  <p className="notification-text">
                    <strong>New activity on your post:</strong> "{notification.postText}"{' '}
                    <span
                      className={`notification-tag ${
                        notification.collectionName === 'LostItems' ? 'tag-lost' : 'tag-found'
                      }`}
                    >
                      {notification.collectionName === 'LostItems'
                        ? 'Lost Item'
                        : 'Found Item'}
                    </span>
                  </p>
                  <p className="comment-text">
                    <strong>
                      Latest comment by {notification.latestCommentAuthor}:
                    </strong>{' '}
                    {notification.latestCommentText}
                  </p>
                  <p className="meta-text">
                    <strong>Total comments:</strong> {notification.commentCount}
                  </p>
                  <p className="time-text">
                    {notification.latestTimestamp
                      ? timeAgo(notification.latestTimestamp)
                      : 'Just now'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-state">
          <EmptyStateIcon />
          <p className="no-notifications">No new activity on your posts.</p>
        </div>
      )}
    </div>
  );
}

export default PostNotification;
