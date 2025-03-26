import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ROUTES, ROLES } from '../../lib/constants';
import Header from './Header/Header';
import Sidebar from './Sidebar/Sidebar';
import Loader from '../common/Loader/Loader';
import ToastContainer from '../common/Toast/Toast';

/**
 * Admin Layout component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Admin Layout component
 */
const AdminLayout = ({ children }) => {
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

  // Redirect to appropriate page if not an admin
  if (userDetails.role !== ROLES.ADMIN) {
    return <Navigate to={ROUTES.VEHICLES} replace />;
  }

  return (
    <div className="admin-layout">
      <Header onMenuClick={toggleSidebar} />

      <div className="admin-layout-content">
        <Sidebar visible={sidebarVisible} />

        {/* Mobile sidebar overlay */}
        {isMobile && sidebarVisible && (
          <div 
            className="admin-layout-overlay" 
            onClick={handleOverlayClick}
          ></div>
        )}

        <main className="admin-layout-main">
          {children}
        </main>
      </div>

      <ToastContainer />

      <style jsx>{`
        .admin-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .admin-layout-content {
          display: flex;
          flex: 1;
          position: relative;
        }

        .admin-layout-main {
          flex: 1;
          margin-left: ${sidebarVisible ? (isMobile ? '0' : '250px') : '60px'};
          padding: var(--spacing-lg);
          transition: margin-left var(--transition-normal) ease;
          width: 100%;
          overflow: auto;
        }

        .admin-layout-overlay {
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
          .admin-layout-main {
            margin-left: 0;
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export default AdminLayout;