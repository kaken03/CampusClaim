// RequireAuthRedirect.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';

const RequireAuthRedirect = ({ children }) => {
  const { userData, loading } = useAuth();

  if (loading) return null; // or a loader

  if (userData) {
    // Redirect based on role
    if (userData.role === 'main-admin' || userData.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (userData.school) {
      return <Navigate to={`/school/${userData.school}/home`} replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  return children; // user not logged in, can see login/signup
};

export default RequireAuthRedirect;
