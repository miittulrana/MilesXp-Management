import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ROUTES } from '../lib/constants';
import DriverLayout from '../components/layout/DriverLayout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load pages
const Vehicles = React.lazy(() => import('../features/vehicles/VehiclesPage'));
const VehicleDetails = React.lazy(() => import('../features/vehicles/VehicleDetailPage'));
const Documents = React.lazy(() => import('../features/documents/DocumentsPage'));
const Service = React.lazy(() => import('../features/service/ServicePage'));
const Tracking = React.lazy(() => import('../features/tracking/TrackingPage'));
const Profile = React.lazy(() => import('../features/auth/ProfilePage'));

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
 */
const DriverRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
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
        path={`${ROUTES.VEHICLES}/:id`}
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
        path={ROUTES.SERVICE_DUES}
        element={
          <ProtectedRoute>
            <DriverLayout>
              <React.Suspense fallback={<LoadingFallback />}>
                <Service />
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
                <Tracking />
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
          <Navigate to="/" replace />
        }
      />
    </Routes>
  );
};

export default DriverRoutes;