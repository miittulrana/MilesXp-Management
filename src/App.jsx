import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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
  const { user, userDetails, initialized, loading, authError } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Set a timeout to prevent indefinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && !initialized) {
        console.warn("[ROUTER] Loading timed out after 15 seconds");
        setLoadingTimeout(true);
      }
    }, 15000);
    
    return () => clearTimeout(timeoutId);
  }, [loading, initialized]);
  
  useEffect(() => {
    console.log("[ROUTER] Current router state:", { 
      user: !!user, 
      userDetails: !!userDetails,
      initialized,
      loading,
      authError: authError ? authError.message : null,
      loadingTimeout
    });
  }, [user, userDetails, initialized, loading, authError, loadingTimeout]);

  // Emergency fallback for long loading time
  if (loadingTimeout) {
    console.log("[ROUTER] Using fallback routes due to timeout");
    return <PublicRoutes />;
  }

  // Only show loading if not initialized yet, with max timeout of 10 seconds
  if (!initialized && loading) {
    console.log("[ROUTER] App still initializing, showing loader");
    return (
      <div className="app-loader">
        <Loader size="large" text="Loading application..." />
        {/* Add a manual retry button if loading takes too long */}
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-4 py-2 bg-primary text-white rounded"
          style={{
            marginTop: '2rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#004d99',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
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
    } else if (userDetails) {
      console.log("[ROUTER] Rendering driver routes");
      return <DriverRoutes />;
    } else {
      // We have a user but no userDetails - this should be rare
      // but we'll handle it gracefully by defaulting to driver routes
      console.log("[ROUTER] User authenticated but no details, defaulting to driver routes");
      return <DriverRoutes />;
    }
  }
  
  // Auth error - redirect to public routes
  if (authError) {
    console.log("[ROUTER] Authentication error, rendering public routes");
    return <PublicRoutes />;
  }
  
  // Default to public routes
  console.log("[ROUTER] Not authenticated, rendering public routes");
  return <PublicRoutes />;
};

/**
 * ErrorBoundary component to catch and display errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[APP] Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}>
          <h1>Something went wrong.</h1>
          <p style={{ marginBottom: '1rem' }}>The application encountered an unexpected error.</p>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            textAlign: 'left',
            maxWidth: '100%',
            overflow: 'auto',
            marginBottom: '1rem'
          }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#004d99',
              color: 'white',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Main App component
 */
const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;