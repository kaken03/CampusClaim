import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAdmin = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Check if the user exists AND their role is either 'admin' or 'main-admin'
  if (!user || (user.role !== 'admin' && user.role !== 'main-admin')) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAdmin;