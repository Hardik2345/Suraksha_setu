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
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAlertHistoryQuery, useDeactivateAlertMutation } from '../../app/api';
import type { Alert, AlertSeverity } from '../../types';

const severityColors: Record<AlertSeverity, 'info' | 'warning' | 'error'> = {
  info: 'info',
  warning: 'warning',
  danger: 'error',
  critical: 'error',
};

const typeLabels: Record<string, string> = {
  weather: '🌤️ Weather',
  disaster: '🚨 Disaster',
  health: '🏥 Health',
  security: '🔒 Security',
  general: '📢 General',
};

export default function AlertHistory() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetAlertHistoryQuery();
  const [deactivateAlert, { isLoading: isDeactivating }] = useDeactivateAlertMutation();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const alerts = data?.data || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateAlert(id).unwrap();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to deactivate alert:', err);
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <MuiAlert severity="error">Failed to load alert history. Please try again.</MuiAlert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.dark">
            Alert History
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View and manage all broadcast alerts
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/broadcast')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            New Alert
          </Button>
        </Box>
      </Box>

      {/* Alerts Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 500, overflowY: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Target</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Expires</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        No alerts have been broadcast yet.
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/broadcast')}
                        sx={{ mt: 2, textTransform: 'none' }}
                      >
                        Broadcast First Alert
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert: Alert) => {
                    const isExpired = new Date(alert.expiresAt) < new Date();
                    
                    return (
                      <TableRow key={alert._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                            {alert.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {typeLabels[alert.type] || alert.type}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alert.severity}
                            size="small"
                            color={severityColors[alert.severity]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {alert.targetAudience.replace('-', ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alert.isActive && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                            size="small"
                            color={alert.isActive && !isExpired ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(alert.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color={isExpired ? 'error.main' : 'text.secondary'}>
                            {formatDate(alert.expiresAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {alert.isActive && !isExpired && (
                            <Tooltip title="Deactivate">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteConfirm(alert._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Deactivation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate this alert? Users will no longer see it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirm && handleDeactivate(deleteConfirm)}
            disabled={isDeactivating}
          >
            {isDeactivating ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

