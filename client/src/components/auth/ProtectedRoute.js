import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedUserTypes }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedUserTypes.includes(userType)) {
    return <Navigate to={`/${userType}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute; 