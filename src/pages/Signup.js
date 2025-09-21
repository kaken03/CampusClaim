import React, { useState } from 'react';
import './Signup.css';
import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuth, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [school, setSchool] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Set display name
      await updateProfile(user, {
        displayName: name,
      });

      // Save user info to Firestore under the school's users subcollection
      await setDoc(doc(db, 'schools', school, 'users', user.uid), {
        fullName: name,
        email: user.email,
        school: school,
        createdAt: new Date()
      });

      await auth.updateCurrentUser(user); // optional but safe

      alert('Account created successfully!');
      navigate('/login'); // Redirect to login page
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signup-page">
      <Navbar />
      <div className="signup-container">
        <div className="signup-card">
          <h2 className="signup-title">Create Your Account</h2>
          <p className="signup-subtitle">Join CampusClaim today</p>

          {error && <p className="error-message">{error}</p>}

          <form className="signup-form" onSubmit={handleSignup}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <label>School</label>
            <select
              value={school}
              onChange={e => setSchool(e.target.value)}
              required
            >
              <option value="">Select your school</option>
              <option value="Consolatrix College of Toledo City">Consolatrix College of Toledo City</option>
              <option value="Kaken College of Toledo City">Kaken College of Toledo City</option>
              {/* Add more schools as needed */}
            </select>

            <button type="submit" className="signup-button">Sign Up</button>

            <p className="login-prompt">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
