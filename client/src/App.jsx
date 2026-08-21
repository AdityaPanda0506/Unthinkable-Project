import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import NoticeBoardPage from './pages/NoticeBoardPage';

/**
 * Route Guard enforcing authentication and allowed user roles
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

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return user?.role === 'ADMIN' ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/resident/dashboard" replace />
    );
  }

  return children;
};

/**
 * Public Route Guard: Redirects authenticated users away from the login page
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
    return user.role === 'ADMIN' ? (
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
  const homePath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/resident/dashboard';

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

function App() {
  return (
    <Routes>
      {/* Public Authentication routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Resident Nested Portal Routing */}
      <Route
        path="/resident/*"
        element={
          <ProtectedRoute allowedRoles={['RESIDENT']}>
            <Routes>
              <Route path="dashboard" element={<ResidentDashboard />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Admin Nested Portal Routing */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
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

      {/* Default routing */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/login" replace />
          </ProtectedRoute>
        }
      />

      {/* 404 Route Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
