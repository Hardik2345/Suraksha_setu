import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';

import theme from './theme';
import { store } from './app/store';
import { useLazyGetProfileQuery, useUpdateLocationMutation } from './app/api';
import { useAppSelector } from './app/hooks';
import { selectCurrentUser, selectIsAuthenticated } from './features/auth/authSlice';
import { hasUsableLocation } from './shared/lib/location';
import type { GeoLocation } from './types';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import NotificationProvider from './components/common/NotificationProvider';
import RealtimeAlertListener from './components/realtime/RealtimeAlertListener';
import { AppErrorBoundary, RoutedErrorBoundary } from './components/common/ErrorBoundary';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Citizen Pages
import CitizenDashboard from './pages/citizen/Dashboard';
import CreateSOS from './pages/citizen/CreateSOS';
import MySOSList from './pages/citizen/MySOSList';
import SOSDetail from './pages/citizen/SOSDetail';
import ResourceDirectory from './pages/citizen/ResourceDirectory';
import Alerts from './pages/citizen/Alerts';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AllSOS from './pages/admin/AllSOS';
import ManageResources from './pages/admin/ManageResources';
import BroadcastAlert from './pages/admin/BroadcastAlert';
import AlertHistory from './pages/admin/AlertHistory';

// Auth initialization component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [getProfile] = useLazyGetProfileQuery();
  const [updateLocation] = useUpdateLocationMutation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    // Try to get profile on app load (session restoration)
    getProfile();
  }, [getProfile]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'citizen' || hasUsableLocation(user.location)) return;
    if (!navigator.geolocation) return;

    const syncLocation = () =>
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeoLocation = {
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude],
          };
          updateLocation({ location });
        },
        () => {
          // Geolocation is best-effort here. The app can still function without it.
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );

    syncLocation();
  }, [isAuthenticated, updateLocation, user]);

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AuthInitializer>
          <RealtimeAlertListener />
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <RoutedErrorBoundary
                  title="The login screen failed to render."
                  description="Retry this page and, if needed, return to a safe route."
                  fullScreen
                >
                  <Login />
                </RoutedErrorBoundary>
              }
            />
            <Route
              path="/register"
              element={
                <RoutedErrorBoundary
                  title="The registration screen failed to render."
                  description="Retry this page and, if needed, return to a safe route."
                  fullScreen
                >
                  <Register />
                </RoutedErrorBoundary>
              }
            />

            {/* Protected Citizen Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<CitizenDashboard />} />
              <Route path="/create-sos" element={<CreateSOS />} />
              <Route path="/my-sos" element={<MySOSList />} />
              <Route path="/sos/:id" element={<SOSDetail />} />
              <Route path="/resources" element={<ResourceDirectory />} />
              <Route path="/alerts" element={<Alerts />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route
              element={
                <ProtectedRoute requireAdmin>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/sos" element={<AllSOS />} />
              <Route path="/admin/sos/:id" element={<SOSDetail />} />
              <Route path="/admin/resources" element={<ManageResources />} />
              <Route path="/admin/broadcast" element={<BroadcastAlert />} />
              <Route path="/admin/alert-history" element={<AlertHistory />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <NotificationProvider />
        </AuthInitializer>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRoutes />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
