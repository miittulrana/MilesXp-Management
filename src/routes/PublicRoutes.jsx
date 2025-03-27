import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ROUTES, ROLES } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';

// Lazy load login page
const LoginPage = React.lazy(() => import('../features/auth/LoginPage'));

// Loading fallback
const LoadingFallback = () => {
  return (
    <div className="page-loading">
      <div className="page-loading-spinner"></div>
    </div>
  );
};

/**
 * Public Routes component
 * @returns {JSX.Element} Public routes component
 */
const PublicRoutes = () => {
  const { user, userDetails, initialized, loading } = useAuth();

  // Show simple loading indicator while checking authentication
  if (!initialized || loading) {
    return (
      <div className="public-route-loader">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          user && userDetails ? (
            // Redirect to appropriate page if already logged in
            <Navigate to={userDetails.role === ROLES.ADMIN ? ROUTES.DASHBOARD : ROUTES.VEHICLES} replace />
          ) : (
            <React.Suspense fallback={<LoadingFallback />}>
              <LoginPage />
            </React.Suspense>
          )
        }
      />

      <Route
        path="/"
        element={
          <Navigate to={ROUTES.LOGIN} replace />
        }
      />

      <Route
        path="*"
        element={
          <Navigate to={ROUTES.LOGIN} replace />
        }
      />
    </Routes>
  );
};

export default PublicRoutes;