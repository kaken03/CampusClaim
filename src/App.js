import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar'; // Import Navbar
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <div className="App">
      <Navbar /> {/* Use Navbar Component */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="hero-section" style={styles.heroSection}>
              <div style={styles.heroContent}>
                <h1 style={styles.heroTitle}>Welcome to CampusClaim</h1>
                <p style={styles.heroTagline}>
                  The ultimate platform to manage lost and found items on campus.
                </p>
                <div style={styles.heroCTA}>
                  <a href="/signup" style={styles.ctaButton}>
                    Get Started
                  </a>
                </div>
              </div>
            </div>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
}

const styles = {
  heroSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '80vh',
    backgroundColor: '#f9f9f9',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  heroContent: {
    flex: 1,
    textAlign: 'center',
    padding: '20px',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  heroTagline: {
    fontSize: '1.2rem',
    color: '#555',
    marginBottom: '30px',
  },
  heroCTA: {
    marginTop: '20px',
  },
  ctaButton: {
    padding: '10px 20px',
    fontSize: '1rem',
    color: '#fff',
    backgroundColor: '#1d3557',
    textDecoration: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
  },
  heroIllustration: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '10px',
  },
};

export default App;