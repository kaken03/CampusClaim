import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/Authcontext';
import './LoginSignup.css';

function Login({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {  userData, loading, setUserData } = useAuth();

  // Auto redirect if already logged in
  useEffect(() => {
    if (!loading && userData) {
      if (userData.role === 'main-admin' || userData.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (userData.school) {
        navigate(`/school/${userData.school}/home`, { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [userData, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const schools = ['Consolatrix College of Toledo City', 'Kaken College of Toledo City'];
      let userDocData = null;
      let userSchool = null;

      for (const school of schools) {
        const userRef = doc(db, 'schools', school, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          userDocData = snap.data();
          userSchool = school;
          break;
        }
      }

      if (!userDocData || !userSchool) {
        setError('No user profile found. Please contact support.');
        return;
      }

      // Blocked user handling
      if (userDocData.isBlocked) {
        const blockedUser = {
          uid: user.uid,
          email: user.email,
          role: userDocData.role,
          school: userSchool,
          isBlocked: true
        };
        localStorage.setItem('user', JSON.stringify(blockedUser));
        setUserData(blockedUser);
        setError('Your account has been blocked by the admin.');
        return;
      }

      // Save minimal user info for normal users
      const loggedInUser = {
        uid: user.uid,
        email: user.email,
        role: userDocData.role,
        school: userSchool,
        isBlocked: false
      };
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUserData(loggedInUser);

    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password");
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
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>

          <button type="submit" className="login-button">Login</button>

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
