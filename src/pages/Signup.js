import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './LoginSignup.css';

function Signup({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Save user in Firestore with default role
      await setDoc(doc(db, 'schools', school, 'users', user.uid), {
        fullName: name,
        email: user.email,
        school: school,
        role: 'student',    // ADD ROLE
        isBlocked: false,   // Default
        createdAt: new Date()
      });

      setSuccessMessage('Account created successfully! Redirecting...');

      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);

    } catch (err) {
      if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 or more characters");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please use another email.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="form-container" style={{ position: 'relative', minHeight: 420 }}>
      
      {successMessage && (
        <div className="signup-success-message">{successMessage}</div>
      )}

      <div className="signup-card">
        <h2 className="signup-title">Create Your Account</h2>

        {error && <p className="error-message">{error}</p>}

        <form className="signup-form" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>

          <select value={school} onChange={(e) => setSchool(e.target.value)} required>
            <option value="">Select your school</option>
            <option value="Consolatrix College of Toledo City">
              Consolatrix College of Toledo City
            </option>
            {/* <option value="Kaken College of Toledo City">Kaken College of Toledo City</option> */}
          </select>

          <button type="submit" className="signup-button">Sign Up</button>

          <p className="login-prompt">
            Already have an account?{" "}
            <span className="switch-link" onClick={onSwitchToLogin}>Login</span>
          </p>

        </form>
      </div>
    </div>
  );
}

export default Signup;
