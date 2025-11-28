import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/Authcontext';
import './RequireUser.css';

const RequireUser = ({ children }) => {
  const { userData, setUserData } = useAuth();
  const [loadingUser, setLoadingUser] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData || !userData.uid) {
      setLoadingUser(false);
      return;
    }

    // Real-time listener
    const userRef = doc(db, 'schools', userData.school, 'users', userData.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedUser = { ...userData, ...docSnap.data() };
        setUserData(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsBlocked(updatedUser.isBlocked || false);
      }
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, [userData, setUserData]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUserData(null);
    navigate('/', { replace: true });
  };

  if (loadingUser) return null;

  if (!userData) return <Navigate to="/" replace />;

  // Admin redirect
  if (userData.role === 'admin' || userData.role === 'main-admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // Blocked modal
  if (isBlocked) {
    return (
      <div className="blocked-overlay">
        <div className="blocked-modal">
          <h2>Your account has been blocked</h2>
          <p>Please go to the Lost & Found Office if you believe this is a mistake.</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireUser;
