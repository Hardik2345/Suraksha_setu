import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';

import theme from './theme';
import { store } from './app/store';
import { useLazyGetProfileQuery } from './app/api';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import NotificationProvider from './components/common/NotificationProvider';

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

  useEffect(() => {
    // Try to get profile on app load (session restoration)
    getProfile();
  }, [getProfile]);

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
