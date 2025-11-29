import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useGetSOSListQuery, useUpdateSOSStatusMutation } from '../../app/api';
import type { SOSStatus, SOSSeverity, SOS, User, ApiError } from '../../types';

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

export default function AllSOS() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<SOSStatus | 'all'>('all');
  const [editDialog, setEditDialog] = useState<{ open: boolean; sos: SOS | null }>({
    open: false,
    sos: null,
  });
  const [updateData, setUpdateData] = useState<{ status: SOSStatus; adminNotes: string }>({
    status: 'pending',
    adminNotes: '',
  });

  const { data, isLoading, error, refetch } = useGetSOSListQuery(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  );
  const [updateSOSStatus, { isLoading: isUpdating }] = useUpdateSOSStatusMutation();

  const sosList = data?.data || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenEdit = (sos: SOS) => {
    setEditDialog({ open: true, sos });
    setUpdateData({
      status: sos.status,
      adminNotes: sos.adminNotes || '',
    });
  };

  const handleCloseEdit = () => {
    setEditDialog({ open: false, sos: null });
  };

  const handleUpdateStatus = async () => {
    if (!editDialog.sos) return;

    try {
      await updateSOSStatus({
        id: editDialog.sos._id,
        data: updateData,
      }).unwrap();
      handleCloseEdit();
    } catch (err) {
      const apiError = err as { data?: ApiError };
      console.error('Failed to update SOS:', apiError.data?.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.dark">
            All SOS Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage and respond to emergency reports
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Failed to load SOS reports. Please try again.
        </Alert>
      )}

      {/* Status Filter Tabs */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(_, v) => setStatusFilter(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          <Tab label="All" value="all" />
          <Tab label="Pending" value="pending" />
          <Tab label="Acknowledged" value="acknowledged" />
          <Tab label="In Progress" value="in-progress" />
          <Tab label="Resolved" value="resolved" />
        </Tabs>
      </Card>

      {/* SOS List Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 500, overflowY: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reporter</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sosList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        No SOS reports found with the selected filter.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sosList.map((sos: SOS) => (
                    <TableRow key={sos._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                          {sos.type}
                        </Typography>
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
                        <Chip
                          label={sos.status}
                          size="small"
                          color={statusColors[sos.status]}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {typeof sos.userId === 'object'
                            ? (sos.userId as User).name
                            : 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {typeof sos.userId === 'object'
                            ? (sos.userId as User).phone || (sos.userId as User).email
                            : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {sos.location?.address || `${sos.location?.lat?.toFixed(4)}, ${sos.location?.lng?.toFixed(4)}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(sos.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/admin/sos/${sos._id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update Status">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleOpenEdit(sos)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Status Dialog */}
      <Dialog open={editDialog.open} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Update SOS Status</DialogTitle>
        <DialogContent>
          {editDialog.sos && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <strong>Type:</strong> {editDialog.sos.type} |{' '}
                <strong>Severity:</strong> {editDialog.sos.severity}
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={updateData.status}
                  label="Status"
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value as SOSStatus })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Admin Notes"
                multiline
                rows={3}
                value={updateData.adminNotes}
                onChange={(e) => setUpdateData({ ...updateData, adminNotes: e.target.value })}
                placeholder="Add notes about this case..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

