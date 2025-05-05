import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import PostBox from '../components/PostBox';                                                                    
import PostFeed from '../components/PostFeed';


function Home() {
  return (
    
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Lost it? Found it? Claim it!</h1>
          <p className="hero-tagline">
            CampusClaim helps you manage lost and found items effortlessly.
          </p>
          <div className="hero-buttons">
            <Link to="/report-lost" className="cta-button">Report Lost Item</Link>
            <Link to="/view-found" className="cta-button secondary">View Found Items</Link>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <img src="/icons/report.svg" alt="Report" />
            <h3>Report</h3>
            <p>Report your lost item with details.</p>
          </div>
          <div className="step">
            <img src="/icons/post.svg" alt="Post" />
            <h3>Post</h3>
            <p>Post found items to help others.</p>
          </div>
          <div className="step">
            <img src="/icons/claim.svg" alt="Claim" />
            <h3>Claim</h3>
            <p>Reunite with your belongings.</p>
          </div>
        </div>
      </section>
      <PostBox />
      <PostFeed />
      

      {/* Recent Listings Section */}

      {/* About Section */}
      <section className="about-section">
        <h2>About CampusClaim</h2>
        <p>
          CampusClaim is a platform designed to help students and staff manage lost and found items on campus. 
          Our mission is to make it easy to report, post, and claim items, fostering a more connected and helpful community.
        </p>
      </section>

      {/* Footer */}
      
    </div>
  );
}

export default Home;

