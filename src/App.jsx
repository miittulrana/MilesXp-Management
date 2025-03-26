import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  
  // Show loader while checking authentication
  if (!initialized || loading) {
    return (
      <div className="app-loader">
        <Loader size="large" text="Loading..." />
      </div>
    );
  }
  
  // Determine which routes to render based on auth state and role
  if (user && userDetails) {
    return userDetails.role === ROLES.ADMIN ? <AdminRoutes /> : <DriverRoutes />;
  }
  
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