import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ROUTES } from '../lib/constants';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load pages to improve initial load time
const Dashboard = React.lazy(() => import('../features/dashboard/pages/DashboardPage'));
const Vehicles = React.lazy(() => import('../features/vehicles/pages/VehiclesPage'));
const VehicleDetails = React.lazy(() => import('../features/vehicles/pages/VehicleDetailPage'));
const Drivers = React.lazy(() => import('../features/drivers/pages/DriversPage'));
const DriverDetails = React.lazy(() => import('../features/drivers/pages/DriverDetailPage'));
const Documents = React.lazy(() => import('../features/documents/pages/DocumentsPage'));
const DocumentStatus = React.lazy(() => import('../features/documents/pages/DocumentStatusPage'));
const ServiceDues = React.lazy(() => import('../features/service-dues/pages/ServiceDuesPage'));
const AssignVehicle = React.lazy(() => import('../features/assignments/pages/AssignmentsPage'));
const BlockVehicle = React.lazy(() => import('../features/blocks/pages/BlocksPage'));
const VehicleLogs = React.lazy(() => import('../features/logs/pages/LogsPage'));
const Calendar = React.lazy(() => import('../features/calendar/pages/CalendarPage'));
const VehicleTracking = React.lazy(() => import('../features/tracking/pages/TrackingPage'));
const Reports = React.lazy(() => import('../features/reports/pages/ReportsPage'));
const Profile = React.lazy(() => import('../features/auth/pages/ProfilePage'));
const Settings = React.lazy(() => import('../features/settings/pages/SettingsPage'));
const NotFound = React.lazy(() => import('../features/common/pages/NotFoundPage'));

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
 * @returns {JSX.Element} Admin routes component
 */
const AdminRoutes = () => {
  return (
    <Routes>
      <Route
        path={ROUTES.DASHBOARD}
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
        path={ROUTES.VEHICLE_DETAILS.replace(':id', ':id')}
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
        path={ROUTES.DRIVER_DETAILS.replace(':id', ':id')}
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
        path={ROUTES.DOCUMENT_STATUS}
        element={
          <ProtectedRoute>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <DocumentStatus />
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
                <ServiceDues />
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
                <AssignVehicle />
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
                <BlockVehicle />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.VEHICLE_LOGS}
        element={
          <ProtectedRoute>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <VehicleLogs />
              </React.Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.CALENDAR}
        element={
          <ProtectedRoute>
            <AdminLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Calendar />
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
                <VehicleTracking />
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
          <AdminLayout>
            <React.Suspense fallback={<LoadingFallback />}>
              <NotFound />
            </React.Suspense>
          </AdminLayout>
        }
      />
    </Routes>
  );
};

export default AdminRoutes;