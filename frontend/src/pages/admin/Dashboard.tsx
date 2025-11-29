import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Campaign as BroadcastIcon,
  LocalHospital as ResourceIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useGetAdminDashboardQuery, useGetAlertHistoryQuery } from '../../app/api';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../../features/auth/authSlice';
import type { SOS, SOSStatus, SOSSeverity } from '../../types';

const statusColors: Record<SOSStatus, 'warning' | 'info' | 'primary' | 'success'> = {
  pending: 'warning',
  acknowledged: 'info',
  'in-progress': 'primary',
  resolved: 'success',
};

const severityColors: Record<SOSSeverity, 'success' | 'warning' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [sosViewType, setSOSViewType] = useState<'severity' | 'status'>('severity');

  const { data: dashboardData, isLoading, error } = useGetAdminDashboardQuery();
  const { data: alertsData } = useGetAlertHistoryQuery();

  const data = dashboardData?.data;
  const recentAlerts = alertsData?.data?.slice(0, 5) || [];

  // Build status counts
  const statusCounts: Record<string, number> = {};
  data?.statuses?.forEach((s) => {
    statusCounts[s._id] = s.count;
  });

  // Build severity counts
  const severityCounts: Record<string, number> = {};
  data?.severities?.forEach((s) => {
    severityCounts[s._id] = s.count;
  });

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load dashboard data. Please try again.</Alert>
      </Box>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewChange = (event: SelectChangeEvent) => {
    setSOSViewType(event.target.value as 'severity' | 'status');
  };

  const statCards = [
    { label: 'Total SOS Reports', value: data?.total || 0, gradient: '#ffffff', textColor: '#f97316', borderColor: '#fed7aa' },
    { label: 'Pending', value: statusCounts['pending'] || 0, gradient: '#ffffff', textColor: '#ea580c', borderColor: '#fed7aa' },
    { label: 'In Progress', value: statusCounts['in-progress'] || 0, gradient: '#ffffff', textColor: '#0284c7', borderColor: '#bae6fd' },
    { label: 'Resolved', value: statusCounts['resolved'] || 0, gradient: '#ffffff', textColor: '#16a34a', borderColor: '#bbf7d0' },
  ];

  const actionButtons = [
    { label: 'Manage SOS Reports', icon: <PendingIcon />, onClick: () => navigate('/admin/sos'), variant: 'contained' as const, color: 'error' as const, isOrange: true },
    { label: 'Broadcast Alert', icon: <BroadcastIcon />, onClick: () => navigate('/admin/broadcast'), variant: 'outlined' as const, color: 'inherit' as const },
    { label: 'Manage Resources', icon: <ResourceIcon />, onClick: () => navigate('/admin/resources'), variant: 'outlined' as const, color: 'inherit' as const },
    { label: 'Alert History', icon: <TimelineIcon />, onClick: () => navigate('/admin/alert-history'), variant: 'outlined' as const, color: 'inherit' as const },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="primary.dark">
          Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Welcome back, {user?.name || 'Admin'}. Here's your command center.
        </Typography>
      </Box>

      {/* Row 1: KPI Cards - 4 columns */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        {statCards.map((stat, index) => (
          <Card
            key={index}
            sx={{
              background: stat.gradient,
              borderRadius: 3,
              border: '1px solid',
              borderColor: stat.borderColor,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="overline" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: 1,
                  color: '#64748b',
                }}
              >
                {stat.label}
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" sx={{ fontSize: '3rem' }} />
              ) : (
                <Typography variant="h3" fontWeight={700} sx={{ mt: 1, color: stat.textColor }}>
                  {stat.value}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Row 2: Action Buttons - 4 columns */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        {actionButtons.map((action, index) => (
          <Button
            key={index}
            fullWidth
            variant={action.variant}
            color={action.color}
            size="large"
            startIcon={action.icon}
            onClick={action.onClick}
            sx={{
              py: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              ...(action.isOrange && {
                backgroundColor: '#ea580c',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#c2410c',
                },
              }),
              ...(!action.isOrange && {
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                color: '#334155',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  borderColor: '#cbd5e1',
                },
              }),
            }}
          >
            {action.label}
          </Button>
        ))}
      </Box>

      {/* Row 3: Pending SOS + Recent Alerts - 2 columns (6 each) */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Pending SOS List */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ pt: 2, px: 2.5, pb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Pending SOS Reports
              </Typography>
              <Chip
                label={`${data?.pendingList?.length || 0} pending`}
                color="warning"
                size="small"
              />
            </Box>

            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
              ))
            ) : !data?.pendingList?.length ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography color="text.secondary">
                  No pending SOS reports
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 180, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reporter</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.pendingList.slice(0, 5).map((sos: SOS) => (
                      <TableRow key={sos._id} hover>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {sos.type}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sos.severity}
                            size="small"
                            color={severityColors[sos.severity]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          {typeof sos.userId === 'object'
                            ? (sos.userId as { name?: string }).name || 'Unknown'
                            : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Typography
                            component="span"
                            onClick={() => navigate(`/admin/sos/${sos._id}`)}
                            sx={{ 
                              color: 'primary.main', 
                              cursor: 'pointer',
                              fontWeight: 500,
                              fontSize: '0.8125rem',
                              '&:hover': { 
                                textDecoration: 'underline',
                                color: 'primary.dark',
                              },
                            }}
                          >
                            Review →
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ pt: 2, px: 2.5, pb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Recent Alerts
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/admin/broadcast')}
                sx={{ 
                  textTransform: 'none', 
                  py: 0,
                  px: 1,
                  minHeight: 'auto',
                  fontSize: '0.8125rem',
                }}
              >
                + New Alert
              </Button>
            </Box>

            {recentAlerts.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No alerts broadcast yet
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 160, overflowY: 'auto' }}>
                {recentAlerts.slice(0, 5).map((alert) => (
                  <Box
                    key={alert._id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'grey.50',
                      borderLeft: 3,
                      borderLeftColor: alert.severity === 'critical' ? 'error.main' : 
                        alert.severity === 'danger' ? 'warning.main' : 'info.main',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ pr: 1 }}>
                        {alert.title}
                      </Typography>
                      <Chip
                        label={alert.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={alert.isActive ? 'success' : 'default'}
                        sx={{ flexShrink: 0 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(alert.createdAt)} • {alert.type}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Row 4: SOS Statistics (Combined with Dropdown) - Full Width */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ pt: 2, px: 2.5, pb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              SOS Statistics
            </Typography>
            <Select
              value={sosViewType}
              onChange={handleViewChange}
              size="small"
              sx={{ 
                minWidth: 120,
                height: 32,
                fontSize: '0.8125rem',
                borderRadius: 1.5,
                '& .MuiSelect-select': {
                  py: 0.5,
                  px: 1.5,
                },
              }}
            >
              <MenuItem value="severity" sx={{ fontSize: '0.8125rem' }}>By Severity</MenuItem>
              <MenuItem value="status" sx={{ fontSize: '0.8125rem' }}>By Status</MenuItem>
            </Select>
          </Box>
          
          {isLoading ? (
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
          ) : sosViewType === 'severity' ? (
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              {['low', 'medium', 'high', 'critical'].map((severity) => (
                <Box
                  key={severity}
                  sx={{
                    py: 2,
                    px: 2,
                    borderRadius: 2,
                    backgroundColor: 'grey.50',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h4" fontWeight={700} color={`${severityColors[severity as SOSSeverity]}.main`}>
                    {severityCounts[severity] || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize', mt: 0.5 }}>
                    {severity}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              {['pending', 'acknowledged', 'in-progress', 'resolved'].map((status) => (
                <Box
                  key={status}
                  sx={{
                    py: 2,
                    px: 2,
                    borderRadius: 2,
                    backgroundColor: 'grey.50',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h4" fontWeight={700} color={`${statusColors[status as SOSStatus]}.main`}>
                    {statusCounts[status] || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize', mt: 0.5 }}>
                    {status.replace('-', ' ')}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
