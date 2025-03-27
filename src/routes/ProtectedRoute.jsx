import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../lib/constants';
import Loader from '../components/common/Loader/Loader';

/**
 * Enhanced Protected Route component to handle role-based access control
 * @param {Object} props - Component props
 * @returns {JSX.Element} Protected route component
 */
const ProtectedRoute = ({
  children,
  roles = null, // null means accessible to everyone
  redirectTo = ROUTES.LOGIN,
  redirectWhenAuthed = false,
  getRedirectPath = null,
}) => {
  const { user, userDetails, initialized, loading } = useAuth();
  const location = useLocation();
  const userRole = userDetails?.role;

  console.log("[PROTECTED] Route check:", { 
    path: location.pathname,
    roles, 
    hasUser: !!user, 
    userRole,
    loading, 
    initialized
  });

  // Show loader while checking authentication, but only if not initialized
  if (!initialized) {
    return (
      <div className="protected-route-loader">
        <Loader size="large" text="Authenticating..." />
      </div>
    );
  }

  // Handle redirect when already authenticated (like login page)
  if (redirectWhenAuthed && user) {
    const redirectPath = getRedirectPath ? getRedirectPath(userRole) : redirectTo;
    console.log(`[PROTECTED] Already authenticated, redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // Redirect to login if not authenticated and route requires authentication
  if (roles && !user) {
    console.log("[PROTECTED] Not authenticated, redirecting to login");
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  // Handle custom redirect based on user role
  if (getRedirectPath && user) {
    const redirectPath = getRedirectPath(userRole);
    console.log(`[PROTECTED] Role-based redirect to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // Check role-based access
  if (roles && !roles.includes(userRole)) {
    console.log(`[PROTECTED] User role ${userRole} not authorized for this route`);
    return <Navigate to={redirectTo} replace />;
  }

  // If we have a user but loading is still true, show loading indicator
  // This prevents showing protected content before user details are loaded
  if (roles && user && loading && !userDetails) {
    return (
      <div className="protected-route-loader">
        <Loader size="medium" text="Loading data..." />
      </div>
    );
  }

  // Render children with userRole if it's a function component
  if (React.isValidElement(children) && children.type && typeof children.type === 'function') {
    return React.cloneElement(children, { userRole });
  }

  // Render the protected component
  console.log("[PROTECTED] Access granted");
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  roles: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string,
  redirectWhenAuthed: PropTypes.bool,
  getRedirectPath: PropTypes.func,
};

export default ProtectedRoute;