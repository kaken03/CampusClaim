import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import './AdminNavbar.css'; // ✅ Make sure this is imported
import logo from '../assets/images/CAMPUSCLAIM.png';

function NavbarAdmin() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <nav className="navbar-admin">
        <div className="logo-container">
        <div className="logo">
          <Link to="/admin-dashboard" className="logo-link">
          <img src={logo} alt="CampusClaim Logo" className="logo-image" />
            <span className="logo-text">CampusClaim</span>
            
          </Link>
        </div>
        </div>
        

        {/* Hamburger for small screens */}
        <div className="admin-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <div></div>
          <div></div>
          <div></div>
        </div>

        <ul className={`navbar-admin-links ${menuOpen ? 'open' : ''}`}>
          <li><Link to="/admin-users" onClick={() => setMenuOpen(false)}>Users</Link></li>
          <li><Link to="/admin-posts" onClick={() => setMenuOpen(false)}>Posts</Link></li>
          <li><Link to="/admin-approval" onClick={() => setMenuOpen(false)}>Approval</Link></li>
          <li><Link to="/admin-reports" onClick={() => setMenuOpen(false)}>Reports</Link></li>
          <li>
            <button
              className="logout-btn"
              onClick={() => {
                setShowLogoutDialog(true);
                setMenuOpen(false);
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {showLogoutDialog && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <h3>Are you sure you want to log out?</h3>
            <div className="logout-modal-actions">
              <span className="modal-link cancel" onClick={() => setShowLogoutDialog(false)}>Cancel</span>
              <span className="modal-link confirm" onClick={handleLogout}>Continue</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NavbarAdmin;
