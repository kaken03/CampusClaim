import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './RequireUser.css';

const RequireUser = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    if (!user || !user.uid) return;
    const userRef = doc(db, 'schools', user.school, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedUser = { ...user, ...docSnap.data() };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (user.role === 'admin' && user.role !== 'main-admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  if (user.isBlocked) {
    return (
      <div className="blocked-overlay">
        <div className="blocked-modal">
          <h2>Your account has been blocked</h2>
          <p>Please go to the Lost&Found Office if you believe this is a mistake.</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    );
  }
  return children;
};

export default RequireUser;