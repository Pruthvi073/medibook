/**
 * Navbar
 *
 * Sticky top navigation bar rendered on all protected pages.
 * Features:
 *  - MediBook brand logo (gradient icon + text)
 *  - NavLink items with active state highlighting
 *  - Personalised greeting + logout button
 *  - Responsive mobile hamburger menu
 */

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// Navigation link definitions
const NAV_LINKS = [
  { to: '/',        label: 'Predictor',      end: true  },
  { to: '/reports', label: 'Reports',        end: false },
  { to: '/vitals',  label: 'Vitals',         end: false },
  { to: '/nearby',  label: 'Nearby Doctors', end: false },
  { to: '/history', label: 'History',        end: false },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <nav
      id="main-navbar"
      className="sticky top-0 z-40 w-full backdrop-blur-md bg-surface-900/80 border-b border-white/8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ──────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-glow-indigo transition-transform group-hover:scale-110"
                 style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
              {/* Heart icon */}
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="text-lg font-bold gradient-text">MediBook</span>
          </Link>

          {/* ── Desktop Navigation ─────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-400'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* ── User Info + Logout ──────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-slate-400">
              Hi, <span className="text-slate-200 font-medium">{firstName}</span>
            </span>
            <button
              id="btn-navbar-logout"
              onClick={handleLogout}
              className="btn-secondary py-1.5 px-4 text-sm"
            >
              Sign Out
            </button>
          </div>

          {/* ── Mobile hamburger ───────────────────────────── */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ─────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/8 bg-surface-900/95 px-4 py-3 space-y-1 animate-fade-in">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {/* Divider + user info + logout */}
          <div className="pt-2 border-t border-white/8">
            {user && (
              <p className="px-4 py-1 text-xs text-slate-500">{user.email}</p>
            )}
            <button
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
