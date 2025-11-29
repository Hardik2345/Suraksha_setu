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
} from '@mui/icons-material';
import { useGetCitizenDashboardQuery, useGetAlertsQuery } from '../../app/api';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../../features/auth/authSlice';
import type { SOSStatus, Alert as AlertType } from '../../types';

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

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);

  const { data: dashboardData, isLoading, error } = useGetCitizenDashboardQuery();
  const { data: alertsData } = useGetAlertsQuery();

  const stats = dashboardData?.data?.stats;
  const recentSOS = dashboardData?.data?.recentSOS || [];
  const alerts = alertsData?.data || [];

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
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Active Alerts
              </Typography>
              {alerts.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No active alerts in your area.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                  <List disablePadding>
                    {alerts.slice(0, 4).map((alert: AlertType, index: number) => (
                      <Box key={alert._id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <AlertIcon color={alert.severity === 'critical' ? 'error' : 'warning'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight={600}>
                                {alert.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {alert.message}
                              </Typography>
                            }
                          />
                          <Chip
                            label={alert.severity}
                            size="small"
                            color={alert.severity === 'critical' ? 'error' : alert.severity === 'danger' ? 'warning' : 'info'}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </ListItem>
                        {index < alerts.slice(0, 4).length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

