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
        {/* Add more about-related content here */}
      </div>
    </div>
  );
}

export default About;