import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSent(false);
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <Navbar />
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Forgot Password</h2>
          <p className="login-subtitle">We'll send you an email to reset your password.</p>
          {sent && (
            <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>
              Password reset email sent! Please check your inbox (and spam) for instructions.
            </div>
          )}
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
              {error}
            </div>
          )}
          <form className="login-form" onSubmit={handleReset}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="login-button">Send Reset Email</button>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Link to="/login" style={{ color: "#1976d2" }}>Back to Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}