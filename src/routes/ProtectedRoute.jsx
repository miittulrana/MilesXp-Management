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

  // Still initializing auth - show a temporary loader
  if (!initialized) {
    return (
      <div className="protected-route-loader" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size="medium" text="Initializing authentication..." />
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
            This may take a moment...
          </p>
        </div>
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

  // Check role-based access - only if we have userDetails loaded
  if (roles && user && userDetails && !roles.includes(userRole)) {
    console.log(`[PROTECTED] User role ${userRole} not authorized for this route`);
    return <Navigate to={redirectTo} replace />;
  }

  // If we're still loading user details but we have user, show loading
  if (roles && user && loading) {
    return (
      <div className="protected-route-loader" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Loader size="medium" text="Loading user data..." />
      </div>
    );
  }

  // Special case for custom redirect
  if (getRedirectPath && user && userDetails) {
    const redirectPath = getRedirectPath(userRole);
    if (redirectPath) {
      console.log(`[PROTECTED] Role-based redirect to ${redirectPath}`);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Render the protected component
  console.log("[PROTECTED] Access granted");
  
  // Handle children as function
  if (typeof children === 'function') {
    return children({ userRole });
  }
  
  return <>{children}</>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func
  ]),
  roles: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string,
  redirectWhenAuthed: PropTypes.bool,
  getRedirectPath: PropTypes.func,
};

export default ProtectedRoute;