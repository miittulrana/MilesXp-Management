import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES, ROLES } from '../lib/constants';
import AdminLayout from '../components/layout/AdminLayout';
import DriverLayout from '../components/layout/DriverLayout';
import ProtectedRoute from './ProtectedRoute';

// Loading fallback
const LoadingFallback = () => (
  <div className="page-loading">
    <div className="page-loading-spinner"></div>
  </div>
);

// Lazy load pages
const LoginPage = React.lazy(() => import('../features/auth/LoginPage'));
const Dashboard = React.lazy(() => import('../features/dashboard/DashboardPage'));
const Vehicles = React.lazy(() => import('../features/vehicles/VehiclesPage'));
const VehicleDetails = React.lazy(() => import('../features/vehicles/VehicleDetailPage'));
const Drivers = React.lazy(() => import('../features/drivers/DriversPage'));
const DriverDetails = React.lazy(() => import('../features/drivers/DriverDetailPage'));
const Documents = React.lazy(() => import('../features/documents/DocumentsPage'));
// Removed DocumentStatusPage import that was causing an error
const Assignments = React.lazy(() => import('../features/assignments/AssignmentsPage'));
const Blocks = React.lazy(() => import('../features/blocks/BlocksPage'));
const Service = React.lazy(() => import('../features/service/ServicePage'));
const Tracking = React.lazy(() => import('../features/tracking/TrackingPage'));
const VehicleLogs = React.lazy(() => import('../features/reports/ReportsPage'));
const Reports = React.lazy(() => import('../features/reports/ReportsPage'));
const Profile = React.lazy(() => import('../features/auth/ProfilePage'));
const Settings = React.lazy(() => import('../features/settings/SettingsPage'));
const Users = React.lazy(() => import('../features/users/UsersPage')); // Added Users page

// Simple NotFound component instead of importing
const NotFoundPage = () => (
  <div className="not-found-page">
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

        {/* Dashboard route */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute
              roles={[ROLES.ADMIN]}
              redirectTo={ROUTES.VEHICLES}
            >
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
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

        {/* Driver routes - admin only */}
        <Route
          path={ROUTES.DRIVERS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]} redirectTo={ROUTES.VEHICLES}>
              <AdminLayout>
                <Drivers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={`${ROUTES.DRIVERS}/:id`}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]} redirectTo={ROUTES.VEHICLES}>
              <AdminLayout>
                <DriverDetails />
              </AdminLayout>
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

        {/* Assignment routes - admin only */}
        <Route
          path={ROUTES.ASSIGN_VEHICLE}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]} redirectTo={ROUTES.VEHICLES}>
              <AdminLayout>
                <Assignments />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Block routes - admin only */}
        <Route
          path={ROUTES.BLOCK_VEHICLE}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]} redirectTo={ROUTES.VEHICLES}>
              <AdminLayout>
                <Blocks />
              </AdminLayout>
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
                  <VehicleLogs />
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

        {/* Report routes - admin only */}
        <Route
          path={ROUTES.REPORTS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]} redirectTo={ROUTES.VEHICLES}>
              <AdminLayout>
                <Reports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* User management routes - admin only */}
        <Route
          path={ROUTES.USERS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]} redirectTo={ROUTES.DASHBOARD}>
              <AdminLayout>
                <Users />
              </AdminLayout>
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

        {/* Settings route - admin only */}
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]} redirectTo={ROUTES.VEHICLES}>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Root route - redirect */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to={ROUTES.DASHBOARD} replace />
            </ProtectedRoute>
          }
        />

        {/* 404 route */}
        <Route
          path="*"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DRIVER]} redirectTo={ROUTES.LOGIN}>
              {props => (
                <LayoutSelector userRole={props.userRole}>
                  <NotFoundPage />
                </LayoutSelector>
              )}
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;