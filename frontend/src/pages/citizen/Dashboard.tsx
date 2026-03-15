import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Skeleton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Add as AddIcon,
  LocalHospital as HospitalIcon,
  Notifications as AlertIcon,
  MyLocation as LocationIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useGetCitizenDashboardQuery, useGetAlertsQuery, useUpdateLocationMutation } from '../../app/api';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { hasUsableLocation } from '../../shared/lib/location';
import type { SOSStatus, Alert as AlertType, GeoLocation } from '../../types';

const statusColors: Record<SOSStatus, 'warning' | 'info' | 'primary' | 'success'> = {
  pending: 'warning',
  acknowledged: 'info',
  'in-progress': 'primary',
  resolved: 'success',
};

const statusIcons: Record<SOSStatus, React.ReactNode> = {
  pending: <PendingIcon />,
  acknowledged: <WarningIcon />,
  'in-progress': <WarningIcon />,
  resolved: <CheckCircleIcon />,
};

const alertSeverityConfig: Record<
  AlertType['severity'],
  { chipColor: 'info' | 'warning' | 'error'; accent: string; surface: string; label: string }
> = {
  info: { chipColor: 'info', accent: '#0284c7', surface: '#f0f9ff', label: 'Info' },
  warning: { chipColor: 'warning', accent: '#d97706', surface: '#fff7ed', label: 'Warning' },
  danger: { chipColor: 'error', accent: '#dc2626', surface: '#fef2f2', label: 'Danger' },
  critical: { chipColor: 'error', accent: '#991b1b', surface: '#fee2e2', label: 'Critical' },
};

function formatAlertTime(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60)));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;

  return created.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [updateLocation, { isLoading: isSavingLocation }] = useUpdateLocationMutation();
  const [locationError, setLocationError] = useState('');

  const { data: dashboardData, isLoading, error } = useGetCitizenDashboardQuery();
  const { data: alertsData } = useGetAlertsQuery();

  const stats = dashboardData?.data?.stats;
  const recentSOS = dashboardData?.data?.recentSOS || [];
  const alerts = alertsData?.data || [];
  const needsLocation = !hasUsableLocation(user?.location);

  const handleEnableLocationAlerts = () => {
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser context.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location: GeoLocation = {
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude],
          };
          await updateLocation({ location }).unwrap();
        } catch {
          setLocationError('Failed to save your location. Please try again.');
        }
      },
      (geoError) => {
        setLocationError(`Location access failed: ${geoError.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load dashboard data. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="primary.dark">
          Welcome back, {user?.name || 'User'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Your emergency dashboard overview
        </Typography>
      </Box>

      {needsLocation && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={isSavingLocation ? <CircularProgress size={16} color="inherit" /> : <LocationIcon />}
              onClick={handleEnableLocationAlerts}
              disabled={isSavingLocation}
            >
              {isSavingLocation ? 'Saving...' : 'Use Current Location'}
            </Button>
          }
        >
          Enable location access to receive location-based alerts.
        </Alert>
      )}

      {locationError && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          {locationError}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: 3,
              border: '1px solid #fed7aa',
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: '#64748b' }}>
                Total Reports
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" sx={{ fontSize: '2.5rem' }} />
              ) : (
                <Typography variant="h3" fontWeight={700} sx={{ color: '#f97316' }}>
                  {stats?.total || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: 3,
              border: '1px solid #fed7aa',
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: '#64748b' }}>
                Pending
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" sx={{ fontSize: '2.5rem' }} />
              ) : (
                <Typography variant="h3" fontWeight={700} sx={{ color: '#ea580c' }}>
                  {stats?.pending || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: 3,
              border: '1px solid #bbf7d0',
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: '#64748b' }}>
                Resolved
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" sx={{ fontSize: '2.5rem' }} />
              ) : (
                <Typography variant="h3" fontWeight={700} sx={{ color: '#16a34a' }}>
                  {stats?.resolved || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-sos')}
            sx={{
              py: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(233, 69, 96, 0.4)',
            }}
          >
            Report Emergency
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<HospitalIcon />}
            onClick={() => navigate('/resources')}
            sx={{ py: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Find Resources
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<WarningIcon />}
            onClick={() => navigate('/my-sos')}
            sx={{ py: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            My Reports
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<AlertIcon />}
            onClick={() => navigate('/alerts')}
            sx={{ py: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            View Alerts
          </Button>
        </Grid>
      </Grid>

      {/* Recent Activity & Alerts */}
      <Grid container spacing={3}>
        {/* Recent SOS Reports */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Recent Reports
              </Typography>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
                ))
              ) : recentSOS.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No SOS reports yet. Stay safe!
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                  <List disablePadding>
                    {recentSOS.slice(0, 5).map((sos, index) => (
                      <Box key={sos._id}>
                        <ListItem
                          sx={{ px: 0, cursor: 'pointer' }}
                          onClick={() => navigate(`/sos/${sos._id}`)}
                        >
                          <ListItemIcon>{statusIcons[sos.status]}</ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight={600}>
                                {sos.type.charAt(0).toUpperCase() + sos.type.slice(1)} Emergency
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {new Date(sos.createdAt).toLocaleDateString()} •{' '}
                                {sos.location?.address || 'Location unavailable'}
                              </Typography>
                            }
                          />
                          <Chip
                            label={sos.status}
                            size="small"
                            color={statusColors[sos.status]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </ListItem>
                        {index < recentSOS.slice(0, 5).length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Active Alerts */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Active Alerts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {alerts.length === 0 ? 'No urgent updates right now' : `${alerts.length} live alert${alerts.length > 1 ? 's' : ''} for you`}
                  </Typography>
                </Box>
                {alerts.length > 0 && (
                  <Button
                    size="small"
                    endIcon={<ChevronRightIcon />}
                    onClick={() => navigate('/alerts')}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    View all
                  </Button>
                )}
              </Box>
              {alerts.length === 0 ? (
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    px: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <Box>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 34, mb: 1 }} />
                    <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                      No active alerts in your area
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You are caught up for now. New alerts will appear here in real time.
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {alerts.slice(0, 4).map((alert: AlertType) => {
                      const config = alertSeverityConfig[alert.severity];

                      return (
                        <Box
                          key={alert._id}
                          onClick={() => navigate('/alerts')}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: `1px solid ${config.accent}22`,
                            backgroundColor: config.surface,
                            cursor: 'pointer',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
                              borderColor: `${config.accent}55`,
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box
                              sx={{
                                mt: 0.25,
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#ffffff',
                                color: config.accent,
                                flexShrink: 0,
                              }}
                            >
                              <AlertIcon fontSize="small" />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  mb: 0.75,
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={700}
                                  sx={{
                                    minWidth: 0,
                                    pr: 1,
                                    lineHeight: 1.35,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {alert.title}
                                </Typography>
                                <Chip
                                  label={config.label}
                                  size="small"
                                  color={config.chipColor}
                                  sx={{ flexShrink: 0, fontWeight: 600 }}
                                />
                              </Box>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mb: 1.25,
                                  lineHeight: 1.55,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {alert.message}
                              </Typography>

                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 1,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  {formatAlertTime(alert.createdAt)}
                                  {alert.location?.city ? ` • ${alert.location.city}` : ''}
                                  {alert.location?.radius ? ` • ${alert.location.radius} km radius` : ''}
                                </Typography>
                                <Typography variant="caption" fontWeight={700} sx={{ color: config.accent }}>
                                  Open
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
