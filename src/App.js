import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import campusClaimImg from './assets/images/CAMPUSCLAIM.png';

import post from './assets/icons/post.png';
import report from './assets/icons/report.png';
import claim from './assets/icons/claim.png';

import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
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
              <div className="about-container">
                {/* About Section */}
                <section className="about-section">
                  <h2 className="about-title">About CampusClaim</h2>
                  <p className="about-description">
                    CampusClaim is a platform designed to help students and staff manage lost and found items on campus. 
                    Our mission is to make it easy to report, post, and claim items, fostering a more connected and helpful community.
                  </p>
                </section>
        
                {/* How It Works Section */}
                <section className="how-it-works">
                  <h2 className="about-title">How It Works</h2>
                  <div className="steps-container">
                    <div className="step">
                      <div className="step-icon">
                        <img src={report} alt="Report" />
                      </div>
                      <h3 className="step-title">Report</h3>
                      <p className="step-description">Report your lost item with details.</p>
                    </div>
                    <div className="step">
                      <div className="step-icon">
                        <img src={post} alt="Post" />
                      </div>
                      <h3 className="step-title">Post</h3>
                      <p className="step-description">Post found items to help others.</p>
                    </div>
                    <div className="step">
                      <div className="step-icon">
                        <img src={claim} alt="Claim" />
                      </div>
                      <h3 className="step-title">Claim</h3>
                      <p className="step-description">Reunite with your belongings.</p>
                    </div>
                  </div>
                </section>
        
                {/* Vision Section */}
                <section className="vision-section">
                  <h2 className="about-title">Our Vision</h2>
                  <p className="about-description">
                    At CampusClaim, we believe in creating a community where everyone feels safe and supported. 
                    By providing an efficient and user-friendly platform, we aim to minimize the stress of losing personal belongings 
                    and promote a culture of honesty and cooperation on campus.
                  </p>
                </section>
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

export default App;