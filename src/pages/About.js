import React from 'react';
import NavbarHome from '../components/NavbarHome'; // Adjust path as needed 
import './About.css'; 
import kakenImage from '../assets/images/Kaken1.jpg'; // Import the image 
import post from '../assets/icons/post.png'; // Import the post icon 
import report from '../assets/icons/report.png'; // Import the report icon 
import claim from '../assets/icons/claim.png'; // Import the claim icon 

function About() {
  return (
    <div className="about-page">
      <NavbarHome />
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

        {/* Team Section */}
        <section className="team-section">
          <h2 className="about-title">Meet the Developer</h2>
          <div className="team-container">
            <div className="team-member">
              <img src={kakenImage} alt="Team Member 1" className="team-photo" />
              <h3 className="team-name">Kent Ezekiel R. Villahermosa</h3>
              <p className="team-role">Founder & CEO</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;