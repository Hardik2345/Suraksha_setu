import { useState, FormEvent } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Campaign as BroadcastIcon,
  Send as SendIcon,
  MyLocation as LocationIcon,
  WbSunny as WeatherIcon,
  LocalFireDepartment as DisasterIcon,
  LocalHospital as HealthIcon,
  Lock as SecurityIcon,
  People as AllUsersIcon,
  LocationOn as LocationBasedIcon,
  PersonAdd as AdminOnlyIcon,
} from '@mui/icons-material';
import { useCreateAlertMutation } from '../../app/api';
import type { AlertType, AlertSeverity, AlertTargetAudience, ApiError } from '../../types';

const alertTypes: { value: AlertType; label: string; icon: React.ReactNode }[] = [
  { value: 'weather', label: 'Weather', icon: <WeatherIcon /> },
  { value: 'disaster', label: 'Disaster', icon: <DisasterIcon /> },
  { value: 'health', label: 'Health', icon: <HealthIcon /> },
  { value: 'security', label: 'Security', icon: <SecurityIcon /> },
  { value: 'general', label: 'General', icon: <BroadcastIcon /> },
];

const severityLevels: { value: AlertSeverity; label: string; color: 'info' | 'warning' | 'error' }[] = [
  { value: 'info', label: 'Info', color: 'info' },
  { value: 'warning', label: 'Warning', color: 'warning' },
  { value: 'danger', label: 'Danger', color: 'error' },
  { value: 'critical', label: 'Critical', color: 'error' },
];

const targetOptions: { value: AlertTargetAudience; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Users', description: 'Broadcast to everyone', icon: <AllUsersIcon /> },
  { value: 'location-based', label: 'Location Based', description: 'Target specific area', icon: <LocationBasedIcon /> },
  { value: 'admin-only', label: 'Admin Only', description: 'Only for administrators', icon: <AdminOnlyIcon /> },
];

export default function BroadcastAlert() {
  const navigate = useNavigate();
  const [createAlert, { isLoading }] = useCreateAlertMutation();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general' as AlertType,
    severity: 'info' as AlertSeverity,
    targetAudience: 'all' as AlertTargetAudience,
    lat: 0,
    lng: 0,
    radius: 10,
    city: '',
    state: '',
    expiryHours: 24,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const getLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.message || !formData.type) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.targetAudience === 'location-based' && (!formData.lat || !formData.lng)) {
      setError('Location coordinates are required for location-based alerts');
      return;
    }

    try {
      await createAlert({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        severity: formData.severity,
        targetAudience: formData.targetAudience,
        lat: formData.targetAudience === 'location-based' ? formData.lat : undefined,
        lng: formData.targetAudience === 'location-based' ? formData.lng : undefined,
        radius: formData.targetAudience === 'location-based' ? formData.radius : undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        expiryHours: formData.expiryHours,
      }).unwrap();

      setSuccess('Alert broadcast successfully!');
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'general',
        severity: 'info',
        targetAudience: 'all',
        lat: 0,
        lng: 0,
        radius: 10,
        city: '',
        state: '',
        expiryHours: 24,
      });

      // Navigate to alert history after 2 seconds
      setTimeout(() => {
        navigate('/admin/alert-history');
      }, 2000);
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.message || 'Failed to broadcast alert. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="primary.dark">
          Broadcast Alert
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Send emergency alerts to citizens
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Alert Type */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
              Alert Type *
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
              {alertTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={formData.type === type.value ? 'contained' : 'outlined'}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  startIcon={type.icon}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    fontWeight: formData.type === type.value ? 600 : 400,
                    backgroundColor: formData.type === type.value ? '#1e293b' : 'transparent',
                    borderColor: formData.type === type.value ? '#1e293b' : '#e2e8f0',
                    color: formData.type === type.value ? '#ffffff' : '#334155',
                    '&:hover': {
                      backgroundColor: formData.type === type.value ? '#0f172a' : '#f8fafc',
                      borderColor: formData.type === type.value ? '#0f172a' : '#cbd5e1',
                    },
                  }}
                >
                  {type.label}
                </Button>
              ))}
            </Box>

            {/* Title */}
            <TextField
              fullWidth
              label="Alert Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              inputProps={{ maxLength: 100 }}
            />

            {/* Message */}
            <TextField
              fullWidth
              label="Alert Message *"
              multiline
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe the alert in detail..."
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              inputProps={{ maxLength: 500 }}
              helperText={`${formData.message.length}/500 characters`}
              FormHelperTextProps={{
                sx: { textAlign: 'right', mr: 0 }
              }}
            />

            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Severity */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Severity Level</InputLabel>
                  <Select
                    value={formData.severity}
                    label="Severity Level"
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertSeverity })}
                    renderValue={(value) => {
                      const level = severityLevels.find(l => l.value === value);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={level?.label || value}
                            size="small"
                            color={level?.color || 'info'}
                            sx={{ height: 24 }}
                          />
                          <Typography variant="body2">{level?.label || value}</Typography>
                        </Box>
                      );
                    }}
                  >
                    {severityLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        <Chip
                          label={level.label}
                          size="small"
                          color={level.color}
                          sx={{ mr: 1 }}
                        />
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Expiry */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Alert Duration</InputLabel>
                  <Select
                    value={formData.expiryHours}
                    label="Alert Duration"
                    onChange={(e) => setFormData({ ...formData, expiryHours: e.target.value as number })}
                  >
                    <MenuItem value={1}>1 hour</MenuItem>
                    <MenuItem value={6}>6 hours</MenuItem>
                    <MenuItem value={12}>12 hours</MenuItem>
                    <MenuItem value={24}>24 hours</MenuItem>
                    <MenuItem value={48}>48 hours</MenuItem>
                    <MenuItem value={72}>72 hours</MenuItem>
                    <MenuItem value={168}>1 week</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Target Audience */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
              Target Audience
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
              {targetOptions.map((option) => (
                <Card
                  key={option.value}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    cursor: 'pointer',
                    border: 2,
                    borderColor: formData.targetAudience === option.value ? '#1e293b' : '#e2e8f0',
                    backgroundColor: formData.targetAudience === option.value ? '#f1f5f9' : '#ffffff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: formData.targetAudience === option.value ? '#1e293b' : '#cbd5e1',
                      backgroundColor: formData.targetAudience === option.value ? '#f1f5f9' : '#f8fafc',
                    },
                  }}
                  onClick={() => setFormData({ ...formData, targetAudience: option.value })}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box
                      sx={{
                        color: formData.targetAudience === option.value ? '#1e293b' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {option.icon}
                    </Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: formData.targetAudience === option.value ? '#1e293b' : '#334155' }}>
                      {option.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                    {option.description}
                  </Typography>
                </Card>
              ))}
            </Box>

            {/* Location Fields (only if location-based) */}
            {formData.targetAudience === 'location-based' && (
              <Card variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Location Details
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={useLocation}
                      onChange={(e) => {
                        setUseLocation(e.target.checked);
                        if (e.target.checked) getLocation();
                      }}
                    />
                  }
                  label="Use current location"
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      type="number"
                      value={formData.lat || ''}
                      onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                      disabled={locationLoading}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      type="number"
                      value={formData.lng || ''}
                      onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                      disabled={locationLoading}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Radius (km)"
                      type="number"
                      value={formData.radius}
                      onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="State"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </Grid>
                  {useLocation && (
                    <Grid size={12}>
                      <Button
                        variant="outlined"
                        startIcon={locationLoading ? <CircularProgress size={20} /> : <LocationIcon />}
                        onClick={getLocation}
                        disabled={locationLoading}
                      >
                        {locationLoading ? 'Getting Location...' : 'Refresh Location'}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                backgroundColor: '#0284c7',
                '&:hover': {
                  backgroundColor: '#0369a1',
                },
              }}
            >
              {isLoading ? 'Broadcasting...' : 'Broadcast Alert'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

