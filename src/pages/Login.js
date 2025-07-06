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
  const navigate = useNavigate();

  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      // Optionally parse and check role here too
      navigate('/home');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
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

        if (userData.role === 'admin') {
          alert('Login successful! Redirecting to Admin Dashboard.');
          navigate('/admin-dashboard'); // Adjust route as needed
        } else {
          alert('Login successful!');
          navigate('/home');
        }
      } else {
        setError('No user profile found.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <Navbar />
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