import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ROUTES, ROLES } from './lib/constants';
import AuthProvider from './context/AuthContext';
import ToastProvider from './context/ToastContext';
import { useAuth } from './hooks/useAuth';
import AdminRoutes from './routes/AdminRoutes';
import DriverRoutes from './routes/DriverRoutes';
import PublicRoutes from './routes/PublicRoutes';
import Loader from './components/common/Loader/Loader';

// Import global styles
import './styles/variables.css';
import './styles/global.css';
import './styles/utilities.css';
import './App.css';

/**
 * Root router component to determine which routes to render based on auth state
 */
const AppRouter = () => {
  const { user, userDetails, initialized, loading } = useAuth();
  
  useEffect(() => {
    console.log("[ROUTER] Current router state:", { 
      user: !!user, 
      userDetails: !!userDetails,
      initialized,
      loading
    });
  }, [user, userDetails, initialized, loading]);

  // Only show loading if not initialized yet
  if (!initialized) {
    console.log("[ROUTER] App still initializing, showing loader");
    return (
      <div className="app-loader">
        <Loader size="large" text="Loading..." />
      </div>
    );
  }
  
  // User is authenticated
  if (user) {
    console.log("[ROUTER] User authenticated, proceeding to routes");
    
    // If we have userDetails with role, use that to determine routes
    if (userDetails?.role === ROLES.ADMIN) {
      console.log("[ROUTER] Rendering admin routes");
      return <AdminRoutes />;
    } else {
      console.log("[ROUTER] Rendering driver routes (default)");
      return <DriverRoutes />;
    }
  }
  
  // Default to public routes
  console.log("[ROUTER] Not authenticated, rendering public routes");
  return <PublicRoutes />;
};

/**
 * Main App component
 */
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;