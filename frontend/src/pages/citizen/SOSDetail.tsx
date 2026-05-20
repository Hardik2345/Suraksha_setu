import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Button,
  Skeleton,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { useGetSOSByIdQuery } from '../../app/api';
import type { SOSStatus, User } from '../../types';

const statusColors: Record<SOSStatus, 'warning' | 'info' | 'primary' | 'success'> = {
  pending: 'warning',
  acknowledged: 'info',
  'in-progress': 'primary',
  resolved: 'success',
};

const severityColors: Record<string, 'success' | 'warning' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const typeEmojis: Record<string, string> = {
  earthquake: '🌍',
  fire: '🔥',
  flood: '🌊',
  landslide: '⛰️',
  normal: '🟡',
  smoke: '🌫️',
};

export default function SOSDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetSOSByIdQuery(id!);
  const sos = data?.data;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load SOS details. The report may not exist or you don't have permission to view it.
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Back Button */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3, textTransform: 'none' }}
      >
        Back to Reports
      </Button>

      {isLoading ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Skeleton variant="text" height={40} width="60%" />
            <Skeleton variant="text" height={30} width="40%" sx={{ mt: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 3, borderRadius: 2 }} />
          </CardContent>
        </Card>
      ) : sos ? (
        <Card sx={{ borderRadius: 3, overflow: 'visible' }}>
          {/* Header */}
          <Box
            sx={{
              backgroundColor: '#1e293b',
              p: 4,
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {typeEmojis[sos.type]} {sos.type.charAt(0).toUpperCase() + sos.type.slice(1)} Emergency
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
                  Report ID: {sos._id}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {sos.source && <Chip label={`${sos.source.toUpperCase()} SOS`} size="small" />}
                  {typeof sos.confidenceScore === 'number' && (
                    <Chip label={`Confidence ${Math.round(sos.confidenceScore * 100)}%`} size="small" />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={sos.severity}
                  color={severityColors[sos.severity] as 'success' | 'warning' | 'error'}
                  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                />
                <Chip
                  label={sos.status}
                  color={statusColors[sos.status]}
                  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                />
              </Box>
            </Box>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Description */}
              <Grid size={12}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Description
                </Typography>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="body1">{sos.description}</Typography>
                </Paper>
              </Grid>

              {sos.imageUrl && (
                <Grid size={12}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Snap Evidence
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box
                      component="img"
                      src={sos.imageUrl}
                      alt="Snap SOS evidence"
                      sx={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 2, mb: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Model prediction: {sos.modelPrediction || 'Not available'}
                    </Typography>
                    {typeof sos.confidenceScore === 'number' && (
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {Math.round(sos.confidenceScore * 100)}%
                      </Typography>
                    )}
                    {typeof sos.trustScore === 'number' && (
                      <Typography variant="body2" color="text.secondary">
                        Trust: {Math.round(sos.trustScore * 100)}%
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* Timeline */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Timeline
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TimeIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatDate(sos.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TimeIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatDate(sos.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>
                  {sos.resolvedAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TimeIcon color="success" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Resolved
                        </Typography>
                        <Typography variant="body1" fontWeight={500} color="success.main">
                          {formatDate(sos.resolvedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Location */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Location
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <LocationIcon color="error" />
                  <Box>
                    {sos.location?.address && (
                      <Typography variant="body1" fontWeight={500}>
                        {sos.location.address}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Coordinates: {sos.location?.coordinates?.[1]?.toFixed(6)}, {sos.location?.coordinates?.[0]?.toFixed(6)}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1, textTransform: 'none' }}
                      onClick={() => window.open(`https://www.google.com/maps?q=${sos.location?.coordinates?.[1]},${sos.location?.coordinates?.[0]}`, '_blank')}
                    >
                      View on Map
                    </Button>
                  </Box>
                </Box>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Contact Info */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Contact Information
                </Typography>
                {sos.contactNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <PhoneIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Emergency Contact
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {sos.contactNumber}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {sos.userId && typeof sos.userId === 'object' && (sos.userId as User).name && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Reported By
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {(sos.userId as User).name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(sos.userId as User).email}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Grid>

              {(sos.weatherContext || sos.confidenceBreakdown) && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Snap Analysis
                  </Typography>
                  {sos.weatherContext && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Weather: {sos.weatherContext.summary || 'Unavailable'}
                    </Typography>
                  )}
                  {sos.confidenceBreakdown && (
                    <Typography variant="body2" color="text.secondary">
                      Model {Math.round(sos.confidenceBreakdown.model * 100)}% • Weather {Math.round(sos.confidenceBreakdown.weather * 100)}% • Crowd {Math.round(sos.confidenceBreakdown.crowd * 100)}% • Quality {Math.round(sos.confidenceBreakdown.quality * 100)}% • Trust {Math.round((sos.confidenceBreakdown.trust || sos.trustScore || 0) * 100)}%
                    </Typography>
                  )}
                  {sos.suspicionFlags && sos.suspicionFlags.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {sos.suspicionFlags.map((flag) => (
                        <Chip key={flag} label={flag} size="small" color="warning" />
                      ))}
                    </Box>
                  )}
                </Grid>
              )}

              {/* Admin Notes */}
              {sos.adminNotes && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Admin Notes
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <NotesIcon color="action" />
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
                      <Typography variant="body2">{sos.adminNotes}</Typography>
                    </Paper>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}
