import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import ToastProvider from './context/ToastContext';
import AppRoutes from './routes/Routes'; // Import correctly as AppRoutes
import './styles/variables.css';
import './styles/global.css';
import './styles/utilities.css';
import './App.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes /> {/* Use the correct component name */}
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;