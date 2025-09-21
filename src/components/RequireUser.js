import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireUser = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'admin' && user.role !== 'main-admin') {
    // Prevent admin from accessing user routes
    return <Navigate to="/admin-dashboard" replace />;
  }
  return children;
};

export default RequireUser;