import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import './NavbarHome.css';
import logo from '../assets/images/CAMPUSCLAIM.png';
import { FaBars } from 'react-icons/fa';

// You'd typically import these from an icon library like react-icons or use SVG components
// For demonstration, let's assume you have simple placeholders or will add an icon library.
// Example for react-icons:
// import { IoNotificationsOutline, IoPersonOutline } from 'react-icons/io5';

const NavbarHome = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Effect for initial user check and navigation
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    }
  }, [navigate]);

  const handleNotificationsClick = () => {
    navigate('/notifications');
    setMenuOpen(false); // Close menu on click
  };

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (!user) {
      localStorage.removeItem('user');
      navigate('/');
    }
  });

  return () => unsubscribe();
}, [auth, navigate]);


  const handleLogout = async () => {
  try {
    await auth.signOut(); // wait for Firebase to fully log out
    localStorage.removeItem('user');
    localStorage.removeItem('lastSeen');

    // Delay navigation a bit to ensure state is cleared
    setTimeout(() => {
      navigate('/');
    }, 300);
  } catch (error) {
    console.error('Error logging out:', error.message);
    alert('Failed to log out. Please try again.');
  }
};


  return (
    <>
      <nav className="navbar">
        <div className="logo-container">
      <div className="logo">
  <Link to="/home" className="logo-link">
    <img src={logo} alt="CampusClaim Logo" className="logo-image" />
    <span className="logo-text">CampusClaim</span>
  </Link>
</div>
</div>

        {/* Hamburger Menu Toggle for Mobile */}
        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <FaBars size={24} color="#ffffffff" />
        </div>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/timeline" onClick={() => setMenuOpen(false)}>Timeline</Link>

          {/* Notifications with potential icon */}
          <div className="nav-link-item" onClick={handleNotificationsClick}>
            {/* Example: <IoNotificationsOutline className="nav-icon" /> */}
            Notifications
          </div>

          {/* Profile with potential icon */}
          <Link to="/profile" onClick={() => setMenuOpen(false)} className="nav-link-item">
            {/* Example: <IoPersonOutline className="nav-icon" /> */}
            Profile
          </Link>

          {/* Logout Button styled to stand out */}
          <button
            className="logout-button primary-action-btn" // Added primary-action-btn for distinct styling
            onClick={() => {
              setShowLogoutDialog(true);
              setMenuOpen(false); // Close menu on click
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Dialog (No changes needed here, as it's a separate component of the UI) */}
      {showLogoutDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <div className="dialog-title">Are you sure you want to log out?</div>
            <div className="dialog-actions">
              <button
                className="dialog-button cancel-btn"
                onClick={() => setShowLogoutDialog(false)}
              >
                Cancel
              </button>
              <button
                className="dialog-button confirm-btn" // Changed 'continue-btn' to 'confirm-btn' for clarity
                onClick={() => {
                  setShowLogoutDialog(false);
                  handleLogout();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarHome;