import React from 'react';
import NavbarHome from '../components/NavbarHome';
import './About.css';

function About() {
  return (
    <div className="about-page">
      <NavbarHome />
      <div className="about-container">
        <h1>About CampusClaim</h1>
        <p>
          CampusClaim is a platform designed to help students and staff manage lost and found items on campus. 
          Our mission is to make it easy to report, post, and claim items, fostering a more connected and helpful community.
        </p>
        {/* Add more about-related content here */}
      </div>
    </div>
  );
}

export default About;