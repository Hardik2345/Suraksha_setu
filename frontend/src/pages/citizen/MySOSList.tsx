import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useGetSOSListQuery } from '../../app/api';
import type { SOSStatus, SOS } from '../../types';

const statusColors: Record<SOSStatus, 'warning' | 'info' | 'primary' | 'success'> = {
  pending: 'warning',
  acknowledged: 'info',
  'in-progress': 'primary',
  resolved: 'success',
};

const severityColors: Record<string, 'success' | 'warning' | 'error' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

export default function MySOSList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState<SOSStatus | 'all'>('all');

  const { data, isLoading, error, refetch } = useGetSOSListQuery(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  );

  const sosList = data?.data || [];
  const successMessage = (location.state as { message?: string })?.message;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.dark">
            My SOS Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track your emergency reports and their status
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
            color="error"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-sos')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(233, 69, 96, 0.4)',
            }}
          >
            New SOS
          </Button>
        </Box>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => navigate(location.pathname, { replace: true })}>
          {successMessage}
        </Alert>
      )}

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
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sosList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        No SOS reports found. Stay safe!
                      </Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/create-sos')}
                        sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                      >
                        Report an Emergency
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  sosList.map((sos: SOS) => (
                    <TableRow
                      key={sos._id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/sos/${sos._id}`)}
                    >
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
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {sos.location?.address || `${sos.location?.lat?.toFixed(4)}, ${sos.location?.lng?.toFixed(4)}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(sos.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/sos/${sos._id}`);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

