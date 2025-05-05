import React from 'react';
import NavbarHome from '../components/NavbarHome';
import './About.css';

function About() {
  return (
    <div className="about-page">
      <NavbarHome />
      <div className="about-container">
        <section className="about-section">
        <h2>About CampusClaim</h2>
        <p>
          CampusClaim is a platform designed to help students and staff manage lost and found items on campus. 
          Our mission is to make it easy to report, post, and claim items, fostering a more connected and helpful community.
        </p>
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
        {/* Add more about-related content here */}
      </div>
    </div>
  );
}

export default About;