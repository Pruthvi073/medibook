/**
 * useAuth
 *
 * Convenience hook for consuming the AuthContext.
 * Throws a helpful error if called outside of <AuthProvider>.
 *
 * Usage:
 *   const { user, login, logout, isAuthenticated } = useAuth();
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be called within an <AuthProvider>.');
  }
  return ctx;
}
