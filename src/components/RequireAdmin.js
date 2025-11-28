import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';

const RequireAdmin = ({ children }) => {
  const { userData, loading } = useAuth();

  if (loading) return null; // or a loader

  if (!userData || (userData.role !== 'admin' && userData.role !== 'main-admin')) {
    return <Navigate to="/" replace />;
  }

  if (userData.isBlocked) {
    return (
      <div className="blocked-overlay">
        <div className="blocked-modal">
          <h2>Your account has been blocked</h2>
          <p>Please go to the Lost & Found Office if you believe this is a mistake.</p>
          <button onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}>Logout</button>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAdmin;
