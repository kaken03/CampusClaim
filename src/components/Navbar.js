import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const styles = {
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 30px',
      backgroundColor: '#2c3e50',
      color: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      flexWrap: 'wrap',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
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
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <Link to="/" style={styles.logoText}>CampusClaim</Link>
      </div>
      <div style={styles.navLinks}>
        <Link to="/login" style={styles.navLink}>Login</Link>
        <Link to="/signup" style={styles.navLink}>Sign Up</Link>
      </div>
    </nav>
  );
};

export default Navbar;