import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';

const RequireGuest = ({ children }) => {
  const { userData, loading } = useAuth();

  if (loading) return null; // or a loader

  // Redirect logged-in users
  if (userData) {
    if (userData.role === 'admin' || userData.role === 'main-admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (userData.school) {
      return <Navigate to={`/school/${userData.school}/home`} replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  return children; // guest users
};

export default RequireGuest;
