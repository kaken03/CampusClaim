import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const NavbarHome = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Use the location hook to track path
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasViewed, setHasViewed] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch notifications count based on comments
  useEffect(() => {
    if (!user) return;

    const lostRef = { current: 0 };
    const foundRef = { current: 0 };

    const lastSeen = new Date(localStorage.getItem('lastSeen') || 0);

    const watchCollection = (collectionName) => {
      const postsRef = collection(db, collectionName);
      const q = query(postsRef, where('authorId', '==', user.uid));

      return onSnapshot(q, (snapshot) => {
        let count = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.comments)) {
            data.comments.forEach((comment) => {
              const commentDate = comment.timestamp?.toDate?.() || new Date();
              if (commentDate > lastSeen) {
                count += 1;
              }
            });
          }
        });

        if (collectionName === 'LostItems') {
          lostRef.current = count;
        } else {
          foundRef.current = count;
        }

        setNotificationCount(lostRef.current + foundRef.current);
      });
    };

    const unsubLost = watchCollection('LostItems');
    const unsubFound = watchCollection('FoundItems');

    return () => {
      unsubLost();
      unsubFound();
    };
  }, [user]);

  // Reset the badge count when navigating to the notifications page
  useEffect(() => {
    if (location.pathname === '/notifications') {
      // Store the timestamp when notifications are viewed
      const now = new Date().toISOString();
      localStorage.setItem('lastSeen', now); // Store the view timestamp
      setHasViewed(true);
      setNotificationCount(0); // Reset badge count to 0 when on notifications page
    } else {
      setHasViewed(false); // Reset hasViewed state when not on notifications page
    }
  }, [location]); // Dependency on location to reset the count when the location changes

  const handleNotificationsClick = () => {
    navigate('/notifications'); // Navigate to notifications
  };

  const handleLogout = () => {
    alert('Logged out successfully!');
    navigate('/login');
  };

  const styles = {
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      backgroundColor: '#007BFF',
      color: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    },
    logo: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
    },
    logoText: {
      color: '#fff',
      textDecoration: 'none',
    },
    navLinks: {
      display: 'flex',
      gap: '15px',
    },
    navLink: {
      color: '#fff',
      textDecoration: 'none',
      fontSize: '1rem',
      padding: '5px 10px',
      borderRadius: '5px',
      transition: 'background-color 0.3s',
      position: 'relative',
      cursor: 'pointer',
    },
    badge: {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      background: 'red',
      color: '#fff',
      borderRadius: '50%',
      padding: '3px 6px',
      fontSize: '0.75rem',
    },
    logoutButton: {
      color: '#fff',
      backgroundColor: '#ff4d4d',
      border: 'none',
      borderRadius: '5px',
      padding: '5px 10px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <Link to="/home" style={styles.logoText}>CampusClaim</Link>
      </div>
      <div style={styles.navLinks}>
        <Link to="/profile" style={styles.navLink}>Profile</Link>
        <Link to="/timeline" style={styles.navLink}>Timeline</Link>
        <div style={styles.navLink} onClick={handleNotificationsClick}>
          Notifications
          {/* Only show the badge if not viewed and count > 0 */}
          {!hasViewed && notificationCount > 0 && (
            <span style={styles.badge}>{notificationCount}</span>
          )}
        </div>
        <Link to="/about" style={styles.navLink}>About</Link>
        <Link to="/contact" style={styles.navLink}>Contact Us</Link>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>
    </nav>
  );
};

export default NavbarHome;
