import React from 'react';
import Navbar from './components/Navbar';
import campusClaimImg from './assets/images/CAMPUSCLAIM.png';

import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="hero-section">
        {/* LEFT SIDE */}
        <div className="hero-content">
          <h1 className="hero-title">Welcome to CampusClaim</h1>
          <p className="hero-tagline">
            The ultimate platform to manage lost and found items on campus.
          </p>
          <div className="hero-cta">
            <a
              href="/signup"
              className="cta-button"
            >
              GET STARTED
            </a>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="hero-illustration">
          <img
            src={campusClaimImg}
            alt="CampusClaim Logo"
            className="illustration-image"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
