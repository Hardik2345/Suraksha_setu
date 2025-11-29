import { useState, FormEvent, useEffect } from 'react';
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
} from '@mui/material';
import {
  MyLocation as LocationIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useCreateSOSMutation } from '../../app/api';
import type { SOSType, SOSSeverity, ApiError } from '../../types';

const sosTypes: { value: SOSType; label: string; icon: string }[] = [
  { value: 'flood', label: 'Flood', icon: '🌊' },
  { value: 'fire', label: 'Fire', icon: '🔥' },
  { value: 'earthquake', label: 'Earthquake', icon: '🌍' },
  { value: 'medical', label: 'Medical Emergency', icon: '🏥' },
  { value: 'accident', label: 'Accident', icon: '🚗' },
  { value: 'other', label: 'Other', icon: '⚠️' },
];

const severityLevels: { value: SOSSeverity; label: string; color: 'success' | 'warning' | 'error' | 'error' }[] = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
  { value: 'critical', label: 'Critical', color: 'error' },
];

export default function CreateSOS() {
  const navigate = useNavigate();
  const [createSOS, { isLoading }] = useCreateSOSMutation();

  const [formData, setFormData] = useState({
    type: '' as SOSType | '',
    severity: 'high' as SOSSeverity,
    description: '',
    lat: 0,
    lng: 0,
    address: '',
    contactNumber: '',
  });
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Get user's location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
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
      (err) => {
        setLocationError(`Unable to get location: ${err.message}`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.type) {
      setError('Please select an emergency type');
      return;
    }

    if (!formData.description) {
      setError('Please provide a description of the emergency');
      return;
    }

    if (!formData.lat || !formData.lng) {
      setError('Location is required. Please enable location services.');
      return;
    }

    try {
      await createSOS({
        type: formData.type as SOSType,
        description: formData.description,
        severity: formData.severity,
        location: {
          lat: formData.lat,
          lng: formData.lng,
          address: formData.address || undefined,
        },
        contactNumber: formData.contactNumber || undefined,
      }).unwrap();

      navigate('/my-sos', { state: { message: 'SOS report submitted successfully!' } });
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.message || 'Failed to submit SOS report. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="primary.dark">
          Report Emergency
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Fill in the details below to alert authorities
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Emergency Type Selection */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
              Type of Emergency *
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
              {sosTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={formData.type === type.value ? 'contained' : 'outlined'}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  startIcon={<span>{type.icon}</span>}
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

            {/* Severity Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Severity Level</InputLabel>
              <Select
                value={formData.severity}
                label="Severity Level"
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as SOSSeverity })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {severityLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Chip
                      label={level.label}
                      size="small"
                      color={level.color}
                      sx={{ mr: 1 }}
                    />
                    {level.label} Severity
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Description */}
            <TextField
              fullWidth
              label="Description *"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the emergency situation in detail..."
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              inputProps={{ maxLength: 500 }}
              helperText={`${formData.description.length}/500 characters`}
              FormHelperTextProps={{
                sx: { textAlign: 'right', mr: 0 }
              }}
            />

            {/* Location */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
              Location
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={formData.lat || ''}
                  onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                  disabled={locationLoading}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={formData.lng || ''}
                  onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                  disabled={locationLoading}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={12}>
                <Button
                  variant="outlined"
                  startIcon={locationLoading ? <CircularProgress size={20} /> : <LocationIcon />}
                  onClick={getLocation}
                  disabled={locationLoading}
                  sx={{ 
                    borderRadius: 2,
                    borderColor: '#e2e8f0',
                    color: '#334155',
                    '&:hover': {
                      borderColor: '#cbd5e1',
                      backgroundColor: '#f8fafc',
                    },
                  }}
                >
                  {locationLoading ? 'Getting Location...' : 'Refresh Location'}
                </Button>
                {locationError && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {locationError}
                  </Alert>
                )}
              </Grid>
            </Grid>

            {/* Address */}
            <TextField
              fullWidth
              label="Address (optional)"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Landmark or address details"
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Contact Number */}
            <TextField
              fullWidth
              label="Contact Number (optional)"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              placeholder="Phone number for responders to reach you"
              sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

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
              {isLoading ? 'Submitting...' : 'Submit SOS Report'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

