import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { UserRole } from '@zipi/shared';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Passenger
import PassengerHome from './pages/passenger/PassengerHome';
import RequestTrip from './pages/passenger/RequestTrip';
import RequestDelivery from './pages/passenger/RequestDelivery';
import TripTracking from './pages/passenger/TripTracking';
import PassengerHistory from './pages/passenger/PassengerHistory';
import RequestFreight from './pages/passenger/RequestFreight';

// Driver
import DriverHome from './pages/driver/DriverHome';
import DriverProfile from './pages/driver/DriverProfile';
import DriverHistory from './pages/driver/DriverHistory';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminTrips from './pages/admin/AdminTrips';

// Layout
import Layout from './components/layout/Layout';

function PrivateRoute({ children, roles }: { children: JSX.Element; roles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role as UserRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RoleRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (user.role === UserRole.ADMIN) return <Navigate to="/admin" />;
  if (user.role === UserRole.DRIVER) return <Navigate to="/driver" />;
  return <Navigate to="/home" />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Passenger */}
      <Route
        path="/home"
        element={
          <PrivateRoute roles={[UserRole.PASSENGER]}>
            <Layout>
              <PassengerHome />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/request-trip"
        element={
          <PrivateRoute roles={[UserRole.PASSENGER]}>
            <Layout>
              <RequestTrip />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/request-delivery"
        element={
          <PrivateRoute roles={[UserRole.PASSENGER]}>
            <Layout>
              <RequestDelivery />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/trip/:id"
        element={
          <PrivateRoute roles={[UserRole.PASSENGER]}>
            <Layout>
              <TripTracking />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/request-freight"
        element={
          <PrivateRoute roles={[UserRole.PASSENGER]}>
            <Layout>
              <RequestFreight />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/history"
        element={
          <PrivateRoute roles={[UserRole.PASSENGER]}>
            <Layout>
              <PassengerHistory />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Driver */}
      <Route
        path="/driver"
        element={
          <PrivateRoute roles={[UserRole.DRIVER]}>
            <Layout>
              <DriverHome />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/driver/profile"
        element={
          <PrivateRoute roles={[UserRole.DRIVER]}>
            <Layout>
              <DriverProfile />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/driver/history"
        element={
          <PrivateRoute roles={[UserRole.DRIVER]}>
            <Layout>
              <DriverHistory />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={[UserRole.ADMIN]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute roles={[UserRole.ADMIN]}>
            <Layout>
              <AdminUsers />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <PrivateRoute roles={[UserRole.ADMIN]}>
            <Layout>
              <AdminDrivers />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/trips"
        element={
          <PrivateRoute roles={[UserRole.ADMIN]}>
            <Layout>
              <AdminTrips />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
