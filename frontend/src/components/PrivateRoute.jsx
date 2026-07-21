/**
 * PrivateRoute
 *
 * A route guard component that redirects unauthenticated users to /login.
 * Preserves the attempted URL in React Router state so we can redirect
 * the user back to their intended destination after a successful login.
 *
 * Usage:
 *   <PrivateRoute>
 *     <MyProtectedPage />
 *   </PrivateRoute>
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, saving the current location so we can
    // return to it after the user authenticates.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
