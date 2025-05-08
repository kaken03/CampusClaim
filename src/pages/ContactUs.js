import React from 'react';
import NavbarHome from '../components/NavbarHome';
import './ContactUs.css';

function ContactUs() {
  return (
    <div className="contact-page">
      <NavbarHome />
      <div className="contact-container">
        <section className="contact-header">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-description">
            Have questions, feedback, or need assistance? We're here to help! Reach out to us using the form below or through our contact information.
          </p>
        </section>

        {/* Contact Form Section */}
        <section className="contact-form-section">
          <h2 className="section-title">Get in Touch</h2>
          <form className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" placeholder="Enter your full name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" placeholder="Enter your email address" required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" rows="5" placeholder="Write your message here" required></textarea>
            </div>
            <button type="submit" className="submit-button">Send Message</button>
          </form>
        </section>

        {/* Company Info Section */}
        <section className="company-info-section">
          <h2 className="section-title">Our Contact Information</h2>
          <div className="info-container">
            <div className="info-item">
              <h3>Address</h3>
              <p>Tubod, Toledo City, Cebu, Philippines</p>
            </div>
            <div className="info-item">
              <h3>Email</h3>
              <p><a href="mailto:kentezekielvillahermosa@gmail.com">kentezekielvillahermosa@gmail.com</a></p>
            </div>
            <div className="info-item">
              <h3>Phone</h3>
              <p><a href="tel:+63 916 5644 986">+63 916 5644 986</a></p>
            </div>
            <div className="info-item">
              <h3>Business Hours</h3>
              <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ContactUs;