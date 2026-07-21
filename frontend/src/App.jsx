import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute        from './components/PrivateRoute';
import Navbar              from './components/Navbar';
import EmergencySOSButton  from './components/EmergencySOSButton';
import LoadingSpinner      from './components/LoadingSpinner';

// Eagerly loaded (small, auth-critical)
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazily loaded (larger, only needed when authenticated)
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const ResultsPage      = lazy(() => import('./pages/ResultsPage'));
const HistoryPage      = lazy(() => import('./pages/HistoryPage'));
const ReportUploadPage = lazy(() => import('./pages/ReportUploadPage'));
const NearbyDoctorsPage = lazy(() => import('./pages/NearbyDoctorsPage'));
const VitalsPage       = lazy(() => import('./pages/VitalsPage'));

// Shared layout for all protected pages
function ProtectedLayout({ children }) {
  return (
    <PrivateRoute>
      <Navbar />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      }>
        {children}
      </Suspense>
      <EmergencySOSButton />
    </PrivateRoute>
  );
}

/**
 * Root App component — defines all client-side routes.
 *
 * Public routes:    /login, /register
 * Protected routes: /, /results, /history, /reports, /nearby, /vitals
 */
export default function App() {
  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 font-sans">
      <Routes>
        {/* ─── Public Routes ─────────────────────────────────── */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ─── Protected Routes ──────────────────────────────── */}
        <Route path="/"        element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/results" element={<ProtectedLayout><ResultsPage /></ProtectedLayout>} />
        <Route path="/history" element={<ProtectedLayout><HistoryPage /></ProtectedLayout>} />
        <Route path="/reports" element={<ProtectedLayout><ReportUploadPage /></ProtectedLayout>} />
        <Route path="/nearby"  element={<ProtectedLayout><NearbyDoctorsPage /></ProtectedLayout>} />
        <Route path="/vitals"  element={<ProtectedLayout><VitalsPage /></ProtectedLayout>} />

        {/* ─── Fallback ───────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
