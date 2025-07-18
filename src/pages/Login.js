import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase'; // db is Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/home');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role and block status from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Blocked user check
        if (userData.isBlocked) {
          setError('Your account has been blocked by the admin.');
          await signOut(auth); // Force sign out
          return;
        }

        localStorage.setItem('user', JSON.stringify({ ...user, role: userData.role }));

        setSuccess('Login successful!');
        setTimeout(() => {
          setSuccess('');
          if (userData.role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/home');
          }
        }, 1000); // Show message for 1s, then redirect
      } else {
        setError('No user profile found.');
      }
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid user or password");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="login-page">
      <Navbar />
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Welcome</h2>
          <p className="login-subtitle">Log in to CampusClaim</p>

          {error && <p className="error-message">{error}</p>}
          {success && (
            <div className="success-popup">
              {success}
            </div>
          )}

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
            
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Link to="/forgot-password" style={{ color: "#1976d2", textDecoration: "underline" }}>
                Forgot password?
              </Link>
            </div>

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