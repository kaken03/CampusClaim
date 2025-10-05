import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuth, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './LoginSignup.css';

function Signup({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [school, setSchool] = useState('');
  const auth = getAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, 'schools', school, 'users', user.uid), {
        fullName: name,
        email: user.email,
        school: school,
        createdAt: new Date()
      });
      await auth.updateCurrentUser(user);
      setSuccessMessage('Account created successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        onSwitchToLogin();
      }, 2000); // Show message for 2.2 seconds, then switch to login
    } catch (err) {
      if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 or more characters");
      }
      else if (err.code === "auth/invalid-email") {
        setError("Invalid email");
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
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={0}
                style={{ cursor: "pointer" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <select
              value={school}
              onChange={e => setSchool(e.target.value)}
              required
            >
              <option value="">Select your school</option>
              <option value="Consolatrix College of Toledo City">Consolatrix College of Toledo City</option>
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