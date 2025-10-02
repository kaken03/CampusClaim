import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase'; // db is Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './LoginSignup.css';

function Login({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      if (userData.role === 'main-admin') {
        navigate('/admin-dashboard');
      } else if (userData.school) {
        // Redirect to school-specific homepage
        navigate(`/school/${userData.school}/home`);
      } else {
        // fallback
        navigate('/home');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // First, try to find which school the user belongs to
      
      const schools = ['Consolatrix College of Toledo City', 
                       'Kaken College of Toledo City'];
                       // (add more schools as needed)
      let userData = null;
      let userSchool = null;

      for (const school of schools) {
        const userDocRef = doc(db, 'schools', school, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          userData = userDoc.data();
          userSchool = school;
          break;
        }
      }

      if (userData && userSchool) {
        // Blocked user check
        if (userData.isBlocked) {
          setError('Your account has been blocked by the admin.');
          await signOut(auth); // Force sign out
          return;
        }

        // Store user data including school
        localStorage.setItem('user', JSON.stringify({ 
          ...user, 
          role: userData.role,
          school: userSchool 
        }));

        setSuccess('Login successful!');

        if (userData.role === 'main-admin') {
          navigate('/admin-dashboard');
        } else if (userData.school) {
          navigate(`/school/${userData.school}/home`);
        } else {
          navigate('/home');
        }
      } else {
        setError('No user profile found. Please contact support.');
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
    <div className="form-container"> 
      <div className="login-card">
        <h2 className="signup-title">Log Into CampusClaim</h2>
        {error && <p className="error-message">{error}</p>}
        {success && (
          <div className="success-popup">
            {success}
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
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
              placeholder="Enter your password"
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

          <button type="submit" className="login-button">Login</button>
          
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Link to="/forgot-password" style={{ color: "#2c3e50", textDecoration: "underline" }}>
              Forgot password?
            </Link>
          </div>

          <p className="login-prompt">
            Don't have an account?{" "}
            <span className="switch-link" onClick={onSwitchToSignup}>Sign Up</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;