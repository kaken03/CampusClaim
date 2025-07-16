import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

const NavbarHome = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    }
  }, [navigate]);

  // Handle notifications navigation
  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  // Handle logout
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('lastSeen');
        navigate('/');
      })
      .catch((error) => {
        console.error('Error logging out:', error.message);
        alert('Failed to log out. Please try again.');
      });
  };

  const styles = {
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      backgroundColor: '#1d3557',
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
    logoutButton: {
      color: '#fff',
      backgroundColor: '#ff4d4d',
      border: 'none',
      borderRadius: '5px',
      padding: '5px 10px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    dialogOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.16)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dialogBox: {
      background: '#fff',
      borderRadius: '10px',
      padding: '28px 28px 20px 28px',
      boxShadow: '0 6px 32px rgba(0,0,0,0.13)',
      maxWidth: 350,
      width: '90%',
      textAlign: 'center',
    },
    dialogTitle: {
      fontSize: '1.15rem',
      color: '#1d3557',
      fontWeight: 600,
      marginBottom: 18,
    },
    dialogActions: {
      display: 'flex',
      justifyContent: 'center',
      gap: '18px',
      marginTop: 10,
    },
    dialogButton: {
      padding: '6px 18px',
      borderRadius: '4px',
      border: 'none',
      fontWeight: 600,
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    cancelBtn: {
      backgroundColor: '#e0e0e0',
      color: '#1d3557',
    },
    continueBtn: {
      backgroundColor: '#ff4d4d',
      color: '#fff',
    },
  };

  return (
    <>
      <nav style={styles.navbar}>
        <div style={styles.logo}>
          <Link to="/home" style={styles.logoText}>CampusClaim</Link>
        </div>
        <div style={styles.navLinks}>
          <Link to="/timeline" style={styles.navLink}>Timeline</Link>
          <div title="Unread Notifications" style={styles.navLink} onClick={handleNotificationsClick}>
            Notifications
          </div>
          <Link to="/messages" style={styles.navLink}>Messages</Link>
          <Link to="/profile" style={styles.navLink}>Profile</Link>
          <Link to="/contact" style={styles.navLink}>Contact Us</Link>
          <button
            onClick={() => setShowLogoutDialog(true)}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </nav>
      {showLogoutDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialogBox}>
            <div style={styles.dialogTitle}>Are you sure you want to log out?</div>
            <div style={styles.dialogActions}>
              <button
                style={{ ...styles.dialogButton, ...styles.cancelBtn }}
                onClick={() => setShowLogoutDialog(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.dialogButton, ...styles.continueBtn }}
                onClick={() => {
                  setShowLogoutDialog(false);
                  handleLogout();
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarHome;