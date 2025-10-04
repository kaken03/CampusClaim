import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Navigate, useNavigate } from 'react-router-dom';

const RequireAdmin = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('user'));
    if (!localUser) {
      setLoading(false);
      return;
    }
    // Listen for real-time updates to the user document
    const userRef = doc(db, 'schools', localUser.school, 'users', localUser.uid);
    const unsubscribe = onSnapshot(userRef, (userSnap) => {
      if (userSnap.exists()) {
        setUser({ ...userSnap.data(), uid: localUser.uid });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (loading) return null;

  if (!user || (user.role !== 'admin' && user.role !== 'main-admin')) {
    return <Navigate to="/" replace />;
  }

  if (user.isBlocked) {
    return (
      <div className="blocked-overlay">
        <div className="blocked-modal">
          <h2>Your account has been blocked</h2>
          <p>Please go to the Lost &amp; Found Office if you believe this is a mistake.</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAdmin;