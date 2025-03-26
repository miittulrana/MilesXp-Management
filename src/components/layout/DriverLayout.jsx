import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';
import Header from './Header/Header';
import Sidebar from './Sidebar/Sidebar';
import Loader from '../common/Loader/Loader';
import ToastContainer from '../common/Toast/Toast';

/**
 * Driver Layout component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Driver Layout component
 */
const DriverLayout = ({ children }) => {
  const { user, userDetails, initialized, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarVisible) {
        setSidebarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarVisible]);

  // Toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Close sidebar when clicking on mobile overlay
  const handleOverlayClick = () => {
    if (isMobile && sidebarVisible) {
      setSidebarVisible(false);
    }
  };

  // Show loader while checking authentication
  if (!initialized || loading) {
    return (
      <div className="page-loader">
        <Loader size="large" text="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !userDetails) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <div className="driver-layout">
      <Header onMenuClick={toggleSidebar} />

      <div className="driver-layout-content">
        <Sidebar visible={sidebarVisible} />

        {/* Mobile sidebar overlay */}
        {isMobile && sidebarVisible && (
          <div 
            className="driver-layout-overlay" 
            onClick={handleOverlayClick}
          ></div>
        )}

        <main className="driver-layout-main">
          {children}
        </main>
      </div>

      <ToastContainer />

      <style jsx>{`
        .driver-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .driver-layout-content {
          display: flex;
          flex: 1;
          position: relative;
        }

        .driver-layout-main {
          flex: 1;
          margin-left: ${sidebarVisible ? (isMobile ? '0' : '250px') : '60px'};
          padding: var(--spacing-lg);
          transition: margin-left var(--transition-normal) ease;
          width: 100%;
          overflow: auto;
        }

        .driver-layout-overlay {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 10;
        }

        .page-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .driver-layout-main {
            margin-left: 0;
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
};

DriverLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export default DriverLayout;