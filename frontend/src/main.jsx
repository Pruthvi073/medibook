import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      {/* Wrap the entire app with the authentication context */}
      <AuthProvider>
        {/* Global toast notification system */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background:   '#1e293b',
              color:        '#f1f5f9',
              border:       '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
              fontSize:     '14px',
              fontFamily:   'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#6366f1', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#fff' },
            },
          }}
        />
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
);
