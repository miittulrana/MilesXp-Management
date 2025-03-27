import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ROUTES } from '../lib/constants';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load pages
const Dashboard = React.lazy(() => import('../features/dashboard/DashboardPage'));
const Vehicles = React.lazy(() => import('../features/vehicles/VehiclesPage'));
const VehicleDetails = React.lazy(() => import('../features/vehicles/VehicleDetailPage'));
const Drivers = React.lazy(() => import('../features/drivers/DriversPage'));
const DriverDetails = React.lazy(() => import('../features/drivers/DriverDetailPage'));
const Documents = React.lazy(() => import('../features/documents/DocumentsPage'));
const Assignments = React.lazy(() => import('../features/assignments/AssignmentsPage'));
const Blocks = React.lazy(() => import('../features/blocks/BlocksPage'));
const Service = React.lazy(() => import('../features/service/ServicePage'));
const Tracking = React.lazy(() => import('../features/tracking/TrackingPage'));
const Reports = React.lazy(() => import('../features/reports/ReportsPage'));
const Profile = React.lazy(() => import('../features/auth/ProfilePage'));
const Settings = React.lazy(() => import('../features/settings/SettingsPage'));

// Loading fallback
const LoadingFallback = () => {
  return (
    <div className="page-loading">
      <div className="page-loading-spinner"></div>
    </div>
  );
};

/**
 * Admin Routes component
 */
const AdminRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.VEHICLES}
        element={
          <ProtectedRoute>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Vehicles />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={`${ROUTES.VEHICLES}/:id`}
        element={
          <ProtectedRoute>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <VehicleDetails />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DRIVERS}
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Drivers />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={`${ROUTES.DRIVERS}/:id`}
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <DriverDetails />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DOCUMENTS}
        element={
          <ProtectedRoute>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Documents />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ASSIGN_VEHICLE}
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Assignments />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.BLOCK_VEHICLE}
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Blocks />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.SERVICE_DUES}
        element={
          <ProtectedRoute>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Service />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.VEHICLE_TRACKING}
        element={
          <ProtectedRoute>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Tracking />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.REPORTS}
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Reports />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Profile />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.SETTINGS}
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Settings />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate to="/" replace />
        }
      />
    </Routes>
  );
};

export default AdminRoutes;