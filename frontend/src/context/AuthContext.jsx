/**
 * AuthContext
 *
 * Provides global authentication state to the entire React component tree.
 *
 * Exposed via context:
 *   user            — { id, name, email } or null
 *   token           — JWT string or null
 *   isAuthenticated — boolean convenience flag
 *   login()         — POST /api/auth/login, stores token/user
 *   register()      — POST /api/auth/register, stores token/user
 *   logout()        — clears token/user from state and localStorage
 *
 * State is initialised from localStorage so sessions survive page reloads.
 */

import React, { createContext, useState, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ── Initialise from persisted localStorage values ─────────
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('medibook_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('medibook_token') || null,
  );

  // ── Private helpers ───────────────────────────────────────
  const persistAuth = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('medibook_user', JSON.stringify(userData));
    localStorage.setItem('medibook_token', jwt);
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('medibook_user');
    localStorage.removeItem('medibook_token');
  };

  // ── Public actions ────────────────────────────────────────

  /**
   * Register a new user account.
   * Throws on failure so the calling component can handle errors.
   */
  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    persistAuth(data.user, data.token);
  }, []);

  /**
   * Log in with email and password.
   * Throws on failure so the calling component can handle errors.
   */
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persistAuth(data.user, data.token);
  }, []);

  /**
   * Log the current user out and clear all persisted auth data.
   */
  const logout = useCallback(() => {
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
