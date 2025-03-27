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

/**
 * Route configuration with role-based access control
 * Each route can specify:
 * - path: URL path
 * - element: Component to render
 * - layout: Layout component to use
 * - roles: Array of roles that can access this route 
 * - redirectTo: Path to redirect if user doesn't have access
 */
const routeConfig = [
  // Public routes
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
    layout: null, // No layout for login page
    roles: null, // Null means accessible to everyone
    redirectWhenAuthed: true, // Redirect if already authenticated
    redirectTo: ROUTES.DASHBOARD, // Redirect to dashboard if already logged in
  },
  
  // Dashboard route - admin only
  {
    path: ROUTES.DASHBOARD,
    element: <Dashboard />,
    layout: AdminLayout,
    roles: [ROLES.ADMIN],
    redirectTo: ROUTES.VEHICLES, // Redirect non-admins to vehicles
  },
  
  // Vehicle routes - accessible to all authenticated users
  {
    path: ROUTES.VEHICLES,
    element: <Vehicles />,
    layout: (props) => props.userRole === ROLES.ADMIN ? <AdminLayout>{props.children}</AdminLayout> : <DriverLayout>{props.children}</DriverLayout>,
    roles: [ROLES.ADMIN, ROLES.DRIVER],
  },
  {
    path: `${ROUTES.VEHICLES}/:id`,
    element: <VehicleDetails />,
    layout: (props) => props.userRole === ROLES.ADMIN ? <AdminLayout>{props.children}</AdminLayout> : <DriverLayout>{props.children}</DriverLayout>,
    roles: [ROLES.ADMIN, ROLES.DRIVER],
  },
  
  // Driver routes - admin only
  {
    path: ROUTES.DRIVERS,
    element: <Drivers />,
    layout: AdminLayout,
    roles: [ROLES.ADMIN],
    redirectTo: ROUTES.VEHICLES,
  },
  {
    path: `${ROUTES.DRIVERS}/:id`,
    element: <DriverDetails />,
    layout: AdminLayout,
    roles: [ROLES.ADMIN],
    redirectTo: ROUTES.VEHICLES,
  },
  
  // Document routes - accessible to all authenticated users
  {
    path: ROUTES.DOCUMENTS,
    element: <Documents />,
    layout: (props) => props.userRole === ROLES.ADMIN ? <AdminLayout>{props.children}</AdminLayout> : <DriverLayout>{props.children}</DriverLayout>,
    roles: [ROLES.ADMIN, ROLES.DRIVER],
  },
  // Removed DocumentStatus route entry
  
  // Assignment routes - admin only
  {
    path: ROUTES.ASSIGN_VEHICLE,
    element: <Assignments />,
    layout: AdminLayout,
    roles: [ROLES.ADMIN],
    redirectTo: ROUTES.VEHICLES,
  },
  
  // Block routes - admin only
  {
    path: ROUTES.BLOCK_VEHICLE,
    element: <Blocks />,
    layout: AdminLayout,
    roles: [ROLES.ADMIN],
    redirectTo: ROUTES.VEHICLES,
  },
  
  // Service routes - accessible to all authenticated users
  {
    path: ROUTES.SERVICE_DUES,
    element: <Service />,
    layout: (props) => props.userRole === ROLES.ADMIN ? <AdminLayout>{props.children}</AdminLayout> : <DriverLayout>{props.children}</DriverLayout>,
    roles: [ROLES.ADMIN, ROLES.DRIVER],
  },
  
  // Vehicle logs route - accessible to all authenticated users
  {
    path: ROUTES.VEHICLE_LOGS,
    element: <VehicleLogs />,
    layout: (props) => props.userRole === ROLES.ADMIN ? <AdminLayout>{props.children}</AdminLayout> : <DriverLayout>{props.children}</DriverLayout>,
    roles: [ROLES.ADMIN, ROLES.DRIVER],
  },
  
  
  // Tracking routes - accessible to all authenticated users
  {
    path: ROUTES.VEHICLE_TRACKING,
    element: <Tracking />,
    layout: (props) => props.userRole === ROLES.ADMIN ? <AdminLayout>{props.children}</AdminLayout> : <DriverLayout>{props.children}</DriverLayout>,
    roles: [ROLES.ADMIN, ROLES.DRIVER],
  },
  
  // Report routes - admin only
  {
    path: ROUTES.REPORTS,
    element: <Reports />,
    layout: AdminLayout,
    roles: [ROLES.ADMIN],
    redirectTo: ROUTES.VEHICLES,
  },
  
  // User management routes - admin only (NEW)
  {
    path: ROUTES.USERS,
    element: <Users />,
    layout: AdminLayout,
    roles: [ROLES.ADMIN],
    redirectTo: ROUTES.DASHBOARD,
  },
  
  // Profile route - accessible to all authenticated users
  {
    path: ROUTES.PROFILE,
    element: <Profile />,
    layout: (props) => props.userRole === ROLES.ADMIN ? <AdminLayout>{props.children}</AdminLayout> : <DriverLayout>{props.children}</DriverLayout>,
    roles: [ROLES.ADMIN, ROLES.DRIVER],
  },
  
  // Settings route - admin only
  {
    path: ROUTES.SETTINGS,
    element: <Settings />,
    layout: AdminLayout,
    roles: [ROLES.ADMIN],
    redirectTo: ROUTES.VEHICLES,
  },
  
  // Root route - redirect to dashboard or vehicles based on role
  {
    path: '/',
    element: null,
    layout: null,
    roles: null,
    redirect: true,
    getRedirectPath: (userRole) => userRole === ROLES.ADMIN ? ROUTES.DASHBOARD : ROUTES.VEHICLES,
  },
  
  // 404 route
  {
    path: '*',
    element: <NotFoundPage />,
    layout: (props) => props.userRole === ROLES.ADMIN ? <AdminLayout>{props.children}</AdminLayout> : <DriverLayout>{props.children}</DriverLayout>,
    roles: [ROLES.ADMIN, ROLES.DRIVER],
    fallbackRedirect: ROUTES.LOGIN, // Redirect to login if not authenticated
  },
];

/**
 * Unified Routes component that handles all routing
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {routeConfig.map((route, index) => {
          // Special handling for redirect routes
          if (route.redirect) {
            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <ProtectedRoute
                    roles={route.roles}
                    redirectTo={route.redirectTo}
                    getRedirectPath={route.getRedirectPath}
                  >
                    {route.element}
                  </ProtectedRoute>
                }
              />
            );
          }
          
          // Normal route with layout
          return (
            <Route
              key={index}
              path={route.path}
              element={
                <ProtectedRoute
                  roles={route.roles}
                  redirectTo={route.redirectTo}
                  redirectWhenAuthed={route.redirectWhenAuthed}
                >
                  {route.layout ? (
                    React.createElement(route.layout, {
                      children: route.element,
                      userRole: route.userRole
                    })
                  ) : (
                    route.element
                  )}
                </ProtectedRoute>
              }
            />
          );
        })}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;