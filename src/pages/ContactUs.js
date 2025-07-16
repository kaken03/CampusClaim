import React, { useState, useEffect } from 'react';
import NavbarHome from '../components/NavbarHome';
import './ContactUs.css';
import { db } from '../firebase'; // Make sure this exports your initialized Firestore instance
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function ContactUs() {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Get user info from Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(u => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSent(false);
    setError('');

    if (!user) {
      setError("Please log in to send a message.");
      return;
    }
    if (!user.displayName || !user.email || !message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }

    try {
      await addDoc(collection(db, 'contact_messages'), {
        name: user.displayName,
        email: user.email,
        message,
        createdAt: serverTimestamp(),
        status: 'unread'
      });
      setSent(true);
      setMessage('');
    } catch (err) {
      setError("Failed to send your message. Please try again.");
    }
  };

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
          {!user && (
            <div style={{ color: "red", marginBottom: 15 }}>Please log in to contact the admin and view your messages.</div>
          )}
          <form className="contact-form" onSubmit={handleSubmit}>
            {sent && <div className="success-message" style={{ color: "green", marginBottom: 10 }}>Message sent! We will get back to you soon.</div>}
            {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={user ? (user.displayName || '') : ''}
                readOnly
                required
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={user ? user.email : ''}
                readOnly
                required
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows="5"
                placeholder="Write your message here"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                disabled={!user}
              ></textarea>
            </div>
            <button type="submit" className="submit-button" disabled={!user}>Send Message</button>
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