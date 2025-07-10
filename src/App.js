import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import campusClaimImg from './assets/images/CAMPUSCLAIM.png'; // ✅ Import logo

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <div style={styles.heroSection}>
              {/* LEFT SIDE */}
              <div style={styles.heroContent}>
                <h1 style={styles.heroTitle}>Welcome to CampusClaim</h1>
                <p style={styles.heroTagline}>
                  The ultimate platform to manage lost and found items on campus.
                </p>
                <div style={styles.heroCTA}>
                  <a
                    href="/signup"
                    style={styles.ctaButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#16324a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#1d3557'}
                  >
                    GET STARTED
                  </a>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div style={styles.heroIllustration}>
                <img
                  src={campusClaimImg}
                  alt="CampusClaim Logo"
                  style={styles.illustrationImage}
                />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '90vh',
    background: 'linear-gradient(to bottom, #f9f9f9 0%, #ffffff 100%)',
    padding: '60px 40px',
    fontFamily: "'Poppins', sans-serif",
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    flexWrap: 'wrap',
  },
  heroContent: {
    flex: '1 1 400px',
    padding: '20px',
    textAlign: 'left',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '700',
    color: '#1d3557',
    marginBottom: '20px',
  },
  heroTagline: {
    fontSize: '1.2rem',
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '30px',
  },
  heroCTA: {
    marginTop: '20px',
  },
  ctaButton: {
    padding: '12px 30px',
    fontSize: '1rem',
    color: '#fff',
    backgroundColor: '#1d3557',
    textDecoration: 'none',
    borderRadius: '30px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    display: 'inline-block',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  heroIllustration: {
    flex: '1 1 300px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  illustrationImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  },
};

export default App;
