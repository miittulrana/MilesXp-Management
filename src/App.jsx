import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import ToastProvider from './context/ToastContext';
import Routes from './routes/Routes'; // Use your existing Routes component

// Import global styles
import './styles/variables.css';
import './styles/global.css';
import './styles/utilities.css';
import './App.css';

/**
 * Main App component - Simplified version
 */
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;