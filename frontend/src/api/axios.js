/**
 * Axios Instance
 *
 * Pre-configured Axios client for all API calls to the Express backend.
 *
 * Features:
 *  - baseURL points to /api (proxied to http://localhost:5000 via Vite)
 *  - Request interceptor: automatically attaches the JWT from localStorage
 *  - Response interceptor: handles 401 Unauthorised by clearing auth state
 *    and redirecting the user to the login page
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',       // Vite proxy forwards this to http://localhost:5000/api
  timeout: 15000,        // 15-second request timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT Bearer token ──────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medibook_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: global 401 handling ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired — wipe stored auth and go to login
      localStorage.removeItem('medibook_token');
      localStorage.removeItem('medibook_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
