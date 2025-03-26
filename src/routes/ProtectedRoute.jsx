// src/routes/ProtectedRoute.jsx
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

  console.log("[PROTECTED] Route check:", { 
    adminOnly, 
    hasUser: !!user, 
    loading, 
    initialized, 
    userRole: userDetails?.role 
  });

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
    console.log("[PROTECTED] Not authenticated, redirecting to login");
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  // Check if admin access is required
  if (adminOnly && userDetails.role !== ROLES.ADMIN) {
    // Redirect to appropriate page if not an admin
    console.log("[PROTECTED] Not an admin, redirecting to vehicles");
    return <Navigate to={ROUTES.VEHICLES} replace />;
  }

  // Render the protected component
  console.log("[PROTECTED] Access granted");
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool
};

export default ProtectedRoute;