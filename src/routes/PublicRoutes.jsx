import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ROUTES, ROLES } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader/Loader';

// Lazy load login page
const LoginPage = React.lazy(() => import('../features/auth/pages/LoginPage'));
const NotFound = React.lazy(() => import('../features/common/pages/NotFoundPage'));

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

  // Show loader while checking authentication
  if (!initialized || loading) {
    return (
      <div className="public-route-loader">
        <Loader size="large" text="Loading..." />
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
          <React.Suspense fallback={<LoadingFallback />}>
            <NotFound />
          </React.Suspense>
        }
      />
    </Routes>
  );
};

export default PublicRoutes;