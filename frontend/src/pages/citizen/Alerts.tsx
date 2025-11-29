import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert as MuiAlert,
  Skeleton,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useGetAlertsQuery, useMarkAlertAsReadMutation } from '../../app/api';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../../features/auth/authSlice';
import type { Alert, AlertSeverity } from '../../types';

const severityConfig: Record<AlertSeverity, { color: 'info' | 'warning' | 'error'; icon: React.ReactNode; bg: string }> = {
  info: { color: 'info', icon: <InfoIcon />, bg: '#e3f2fd' },
  warning: { color: 'warning', icon: <WarningIcon />, bg: '#fff3e0' },
  danger: { color: 'error', icon: <ErrorIcon />, bg: '#ffebee' },
  critical: { color: 'error', icon: <ErrorIcon />, bg: '#ffcdd2' },
};

const typeLabels: Record<string, string> = {
  weather: '🌤️ Weather',
  disaster: '🚨 Disaster',
  health: '🏥 Health',
  security: '🔒 Security',
  general: '📢 General',
};

export default function Alerts() {
  const user = useAppSelector(selectCurrentUser);
  const { data, isLoading, error, refetch } = useGetAlertsQuery();
  const [markAsRead] = useMarkAlertAsReadMutation();

  const alerts = data?.data || [];

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead(alertId).unwrap();
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const isAlertRead = (alert: Alert) => {
    return alert.readBy?.includes(user?.id || '');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <MuiAlert severity="error">Failed to load alerts. Please try again.</MuiAlert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.dark">
            Alerts & Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Stay informed about emergencies in your area
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()} color="primary" size="large">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Alert Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isLoading ? 'Loading...' : `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''}`}
      </Typography>

      {/* Alerts List */}
      {isLoading ? (
        [...Array(3)].map((_, i) => (
          <Card key={i} sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={30} />
              <Skeleton variant="text" width="100%" height={60} />
              <Skeleton variant="text" width="30%" />
            </CardContent>
          </Card>
        ))
      ) : alerts.length === 0 ? (
        <Card sx={{ borderRadius: 3, p: 6, textAlign: 'center' }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No active alerts
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You're all caught up! Check back later for updates.
          </Typography>
        </Card>
      ) : (
        alerts.map((alert: Alert) => {
          const config = severityConfig[alert.severity];
          const read = isAlertRead(alert);

          return (
            <Card
              key={alert._id}
              sx={{
                borderRadius: 3,
                mb: 2,
                borderLeft: `4px solid`,
                borderLeftColor: `${config.color}.main`,
                backgroundColor: read ? 'transparent' : config.bg,
                opacity: read ? 0.8 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: `${config.color}.light`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: `${config.color}.main`,
                      }}
                    >
                      {config.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {alert.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={typeLabels[alert.type] || alert.type}
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                        <Chip
                          label={alert.severity}
                          size="small"
                          color={config.color}
                          sx={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
                        />
                        {read && (
                          <Chip
                            label="Read"
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(alert.createdAt)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Message */}
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                  {alert.message}
                </Typography>

                {/* Location Info */}
                {alert.location && alert.location.coordinates && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    📍 {alert.location.city && `${alert.location.city}, `}
                    {alert.location.state || 'Nearby area'}
                    {alert.location.radius && ` (within ${alert.location.radius} km)`}
                  </Typography>
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Expires: {new Date(alert.expiresAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                  {!read && (
                    <Chip
                      label="Mark as Read"
                      size="small"
                      onClick={() => handleMarkAsRead(alert._id)}
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })
      )}
    </Box>
  );
}


