import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, ROLES } from '../lib/constants';
import Loader from '../components/common/Loader/Loader';

/**
 * Protected Route component to handle authentication and authorization
 * @param {Object} props - Component props
 * @returns {JSX.Element} Protected route component
 */
const ProtectedRoute = ({
  children,
  adminOnly = false
}) => {
  const { user, userDetails, initialized, loading } = useAuth();
  const location = useLocation();

  // Show loader while checking authentication
  if (!initialized || loading) {
    return (
      <div className="protected-route-loader">
        <Loader size="large" text="Authenticating..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !userDetails) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  // Check if admin access is required
  if (adminOnly && userDetails.role !== ROLES.ADMIN) {
    // Redirect to appropriate page if not an admin
    return <Navigate to={ROUTES.VEHICLES} replace />;
  }

  // Render the protected component
  return (
    <>
      {children}
      
      <style jsx>{`
        .protected-route-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
      `}</style>
    </>
  );
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool
};

export default ProtectedRoute;