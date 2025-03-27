import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES, ROLES } from '../lib/constants';
import AdminLayout from '../components/layout/AdminLayout';
import DriverLayout from '../components/layout/DriverLayout';
import ProtectedRoute from './ProtectedRoute';
import Loader from '../components/common/Loader/Loader';

// Loading fallback that's more informative
const LoadingFallback = () => (
  <div className="page-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="page-loading-spinner" style={{ 
        display: 'inline-block',
        width: '50px',
        height: '50px',
        border: '4px solid rgba(0, 77, 153, 0.1)',
        borderRadius: '50%',
        borderTopColor: '#004d99',
        animation: 'spin 1s ease-in-out infinite'
      }}></div>
      <p style={{ marginTop: '10px' }}>Loading application resources...</p>
    </div>
  </div>
);

// Import with standard imports instead of lazy loading for now
// Once the app works, you can switch back to lazy loading
import LoginPage from '../features/auth/LoginPage';
import Dashboard from '../features/dashboard/DashboardPage';
import Vehicles from '../features/vehicles/VehiclesPage';
import VehicleDetails from '../features/vehicles/VehicleDetailPage';
import Drivers from '../features/drivers/DriversPage';
import DriverDetails from '../features/drivers/DriverDetailPage';
import Documents from '../features/documents/DocumentsPage';
import Assignments from '../features/assignments/AssignmentsPage';
import Blocks from '../features/blocks/BlocksPage';
import Service from '../features/service/ServicePage';
import Tracking from '../features/tracking/TrackingPage';
import Reports from '../features/reports/ReportsPage';
import Profile from '../features/auth/ProfilePage';
import Settings from '../features/settings/SettingsPage';
import Users from '../features/users/UsersPage';

// Simple NotFound component
const NotFoundPage = () => (
  <div className="not-found-page" style={{ textAlign: 'center', padding: '40px' }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
);

// Component to choose layout based on role
const LayoutSelector = ({ children, userRole }) => {
  if (userRole === ROLES.ADMIN) {
    return <AdminLayout>{children}</AdminLayout>;
  }
  return <DriverLayout>{children}</DriverLayout>;
};

/**
 * Unified Routes component that handles all routing
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Login route */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <ProtectedRoute
              redirectWhenAuthed={true}
              redirectTo={ROUTES.DASHBOARD}
            >
              <LoginPage />
            </ProtectedRoute>
          }
        />

        {/* Root route - redirect */}
        <Route
          path="/"
          element={<Navigate to={ROUTES.LOGIN} replace />}
        />

        {/* Dashboard route */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute
              roles={[ROLES.ADMIN, ROLES.DRIVER]}
            >
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Dashboard />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Vehicles routes */}
        <Route
          path={ROUTES.VEHICLES}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Vehicles />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path={`${ROUTES.VEHICLES}/:id`}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <VehicleDetails />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Driver routes */}
        <Route
          path={ROUTES.DRIVERS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Drivers />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path={`${ROUTES.DRIVERS}/:id`}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <DriverDetails />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Document routes */}
        <Route
          path={ROUTES.DOCUMENTS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Documents />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Assignment routes */}
        <Route
          path={ROUTES.ASSIGN_VEHICLE}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Assignments />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Block routes */}
        <Route
          path={ROUTES.BLOCK_VEHICLE}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Blocks />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Service routes */}
        <Route
          path={ROUTES.SERVICE_DUES}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Service />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Vehicle logs route */}
        <Route
          path={ROUTES.VEHICLE_LOGS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Reports />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Tracking routes */}
        <Route
          path={ROUTES.VEHICLE_TRACKING}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Tracking />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Report routes */}
        <Route
          path={ROUTES.REPORTS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Reports />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* User management routes */}
        <Route
          path={ROUTES.USERS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Users />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Profile route */}
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Profile />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* Settings route */}
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <Settings />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />

        {/* 404 route */}
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;