import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ROUTES } from '../lib/constants';
import DriverLayout from '../components/layout/DriverLayout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load pages to improve initial load time
const Vehicles = React.lazy(() => import('../features/vehicles/pages/VehiclesPage'));
const VehicleDetails = React.lazy(() => import('../features/vehicles/pages/VehicleDetailPage'));
const Documents = React.lazy(() => import('../features/documents/pages/DocumentsPage'));
const DocumentStatus = React.lazy(() => import('../features/documents/pages/DocumentStatusPage'));
const ServiceDues = React.lazy(() => import('../features/service-dues/pages/ServiceDuesPage'));
const VehicleLogs = React.lazy(() => import('../features/logs/pages/LogsPage'));
const Calendar = React.lazy(() => import('../features/calendar/pages/CalendarPage'));
const VehicleTracking = React.lazy(() => import('../features/tracking/pages/TrackingPage'));
const Profile = React.lazy(() => import('../features/auth/pages/ProfilePage'));
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
 * Driver Routes component
 * @returns {JSX.Element} Driver routes component
 */
const DriverRoutes = () => {
  return (
    <Routes>
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Vehicles />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.VEHICLES}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Vehicles />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.VEHICLE_DETAILS.replace(':id', ':id')}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <VehicleDetails />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DOCUMENTS}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Documents />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DOCUMENT_STATUS}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <DocumentStatus />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.SERVICE_DUES}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <ServiceDues />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.VEHICLE_LOGS}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <VehicleLogs />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.CALENDAR}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Calendar />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.VEHICLE_TRACKING}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <VehicleTracking />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Profile />
              </React.Suspense>
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <DriverLayout>
            <React.Suspense fallback={<LoadingFallback />}>
              <NotFound />
            </React.Suspense>
          </DriverLayout>
        }
      />
    </Routes>
  );
};

export default DriverRoutes;