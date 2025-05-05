import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavbarHome = () => {
  const navigate = useNavigate();

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

  const handleLogout = () => {
    alert('Logged out successfully!');
    navigate('/login'); // Redirect to login page
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <Link to="/home" style={styles.logoText}>CampusClaim</Link>
      </div>
      <div style={styles.navLinks}>
        <Link to="/profile" style={styles.navLink}>Profile</Link>
        <Link to="/notifications" style={styles.navLink}>Notifications</Link>
        <Link to="/about" style={styles.navLink}>About</Link>
        <Link to="/contact" style={styles.navLink}>Contact Us</Link>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>
    </nav>
  );
};

export default NavbarHome;