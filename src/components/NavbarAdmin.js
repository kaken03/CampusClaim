import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavbarAdmin.css';
import { auth } from '../firebase';

function NavbarAdmin() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar-admin">
      <div className="navbar-admin-logo">
        <Link to="/admin-dashboard">CampusClaim <span>Admin</span></Link>
      </div>
      <ul className="navbar-admin-links">
        <li><Link to="/admin-dashboard">Dashboard</Link></li>
        <li><Link to="/admin-users">Users</Link></li>
        <li><Link to="/admin-posts">Posts</Link></li>
        <li><Link to="/admin-analytics">Analytics</Link></li>
        
        <li>
          <span 
            className="logout-link" 
            tabIndex={0}
            onClick={() => setShowLogoutModal(true)}
            onKeyDown={e => { if (e.key === 'Enter') setShowLogoutModal(true); }}
          >
            Logout
          </span>
        </li>
      </ul>

      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-modal-actions">
              <span 
                className="modal-link confirm" 
                tabIndex={0}
                onClick={handleLogout}
                onKeyDown={e => { if (e.key === 'Enter') handleLogout(); }}
              >
                Yes, Logout
              </span>
              <span 
                className="modal-link cancel" 
                tabIndex={0}
                onClick={() => setShowLogoutModal(false)}
                onKeyDown={e => { if (e.key === 'Enter') setShowLogoutModal(false); }}
              >
                Cancel
              </span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavbarAdmin;