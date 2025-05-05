import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Import Navbar
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Import Firebase auth instance
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Firebase login
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful!');
      navigate('/home'); // Redirect to Home.js in the screens folder
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <Navbar /> {/* Include Navbar */}
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Log in to CampusClaim</p>

          {error && <p className="error-message">{error}</p>}

          <form className="login-form" onSubmit={handleLogin}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="login-button">Login</button>

            <p className="signup-prompt">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;