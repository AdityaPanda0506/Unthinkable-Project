import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import NoticeBoardPage from './pages/NoticeBoardPage';

/**
 * Route Guard enforcing authentication and allowed user roles.
 * Uses .toUpperCase() for defensive role comparison.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand-light flex items-center justify-center text-charcoal-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-navy"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role?.toUpperCase();

  if (allowedRoles && !allowedRoles.map(r => r.toUpperCase()).includes(role)) {
    return role === 'ADMIN' ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/resident/dashboard" replace />
    );
  }

  return children;
};

/**
 * Public Route Guard: Redirects authenticated users away from the login page.
 */
const PublicRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand-light flex items-center justify-center text-charcoal-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-navy"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return user?.role?.toUpperCase() === 'ADMIN' ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/resident/dashboard" replace />
    );
  }

  return children;
};

/**
 * 404 Fallback page layout
 */
const NotFoundPage = () => {
  const { user } = useAuth();
  const homePath = user?.role?.toUpperCase() === 'ADMIN' ? '/admin/dashboard' : '/resident/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-light text-center px-6 py-12 relative overflow-hidden">
      <div className="z-10 max-w-md">
        <h1 className="text-8xl font-black text-sand-muted select-none tracking-widest">404</h1>
        <h2 className="text-2xl font-bold text-navy mt-4">Page Not Found</h2>
        <p className="text-charcoal-muted text-sm mt-2.5 leading-relaxed font-semibold">
          The page you are looking for does not exist or has been relocated to another route.
        </p>
        <Link
          to={homePath}
          className="inline-block mt-8 bg-navy hover:bg-navy-hover text-white rounded-xl px-6 py-3 font-semibold text-sm tracking-wide shadow-sm active:translate-y-0.5 transition-all"
        >
          Return to Home Portal
        </Link>
      </div>
    </div>
  );
};

/**
 * Redirects /dashboard to the correct role-specific dashboard.
 * Handles old bookmarks and any legacy hard-coded links.
 */
const RoleDashboardRedirect = () => {
  const { user } = useAuth();
  return user?.role?.toUpperCase() === 'ADMIN'
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/resident/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Authentication route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Resident Portal — flat route, no nested <Routes> */}
      <Route
        path="/resident/dashboard"
        element={
          <ProtectedRoute allowedRoles={['RESIDENT']}>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Portal — flat routes, no nested <Routes> */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminComplaints />
          </ProtectedRoute>
        }
      />

      {/* Shared notices route */}
      <Route
        path="/notices"
        element={
          <ProtectedRoute allowedRoles={['RESIDENT', 'ADMIN']}>
            <NoticeBoardPage />
          </ProtectedRoute>
        }
      />

      {/* Legacy /dashboard — dispatches by role */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboardRedirect />
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
