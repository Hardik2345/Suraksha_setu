import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Send as SendIcon,
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  useAnalyzeSnapSOSMutation,
  useConfirmSnapSOSMutation,
  useLazyReverseGeocodeQuery,
} from '../../app/api';
import type { ApiError, SOSType, SnapSOSAnalysisResult, SOSLocation } from '../../types';

const snapTypes: { value: SOSType; label: string }[] = [
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'fire', label: 'Fire' },
  { value: 'flood', label: 'Flood' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'normal', label: 'Normal / Unclear' },
  { value: 'smoke', label: 'Smoke' },
];

const confidenceLabel = (score: number) => {
  if (score >= 0.7) return { label: 'High confidence', color: 'success' as const };
  if (score >= 0.45) return { label: 'Moderate confidence', color: 'warning' as const };
  return { label: 'Low confidence', color: 'error' as const };
};

const initialLocation: SOSLocation = {
  type: 'Point',
  coordinates: [0, 0],
  address: '',
  city: '',
  state: '',
  pincode: '',
};

export default function SnapSOS() {
  const navigate = useNavigate();
  const [analyzeSnapSOS, { isLoading: isAnalyzing }] = useAnalyzeSnapSOSMutation();
  const [confirmSnapSOS, { isLoading: isConfirming }] = useConfirmSnapSOSMutation();
  const [reverseGeocode] = useLazyReverseGeocodeQuery();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [location, setLocation] = useState<SOSLocation>(initialLocation);
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<SnapSOSAnalysisResult | null>(null);
  const [type, setType] = useState<SOSType>('fire');
  const [description, setDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates: [number, number] = [position.coords.longitude, position.coords.latitude];
        try {
          const response = await reverseGeocode(
            { lat: coordinates[1], lng: coordinates[0] },
            true
          ).unwrap();

          setLocation({
            type: 'Point',
            coordinates,
            address: response.data.address || '',
            city: response.data.city || '',
            state: response.data.state || '',
            pincode: response.data.pincode || '',
          });
        } catch {
          setLocation((prev) => ({ ...prev, coordinates }));
        }
      },
      (geoError) => setLocationError(geoError.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    if (!analysis) return;
    setType(analysis.suggestedType);
    setDescription(`Possible ${analysis.suggestedType} incident reported via Snap SOS.`);
  }, [analysis]);

  const sortedProbabilities = useMemo(() => {
    if (!analysis) return [];
    return Object.entries(analysis.classProbabilities).sort((a, b) => b[1] - a[1]);
  }, [analysis]);

  const trustWarnings = useMemo(() => {
    if (!analysis) return [];

    const warnings: string[] = [];
    if (analysis.suspicionFlags.includes('duplicate-image')) {
      warnings.push('Image appears to match a recent upload and has been heavily de-prioritized.');
    }
    if (analysis.suspicionFlags.includes('gps-mismatch') || analysis.suspicionFlags.includes('gps-mismatch-severe')) {
      warnings.push('Image metadata location does not match your device location.');
    }
    if (analysis.suspicionFlags.includes('stale-image') || analysis.suspicionFlags.includes('stale-image-severe')) {
      warnings.push('Image metadata suggests the photo may be old.');
    }
    if (analysis.metadataStatus.includes('missing-exif')) {
      warnings.push('Image metadata is missing, so the report is being treated more conservatively.');
    }

    return warnings;
  }, [analysis]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setAnalysis(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Choose an image before analyzing.');
      return;
    }

    if (!location.coordinates.every((value) => Number.isFinite(value)) || (location.coordinates[0] === 0 && location.coordinates[1] === 0)) {
      setError('Location is required for Snap SOS.');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('location', JSON.stringify(location));

    try {
      setError('');
      const response = await analyzeSnapSOS(formData).unwrap();
      setAnalysis(response.data);
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.message || 'Snap SOS analysis failed. Please try again.');
    }
  };

  const handleConfirm = async () => {
    if (!analysis) {
      setError('Analyze the image before confirming.');
      return;
    }

    if (!description.trim()) {
      setError('Add a short description before submitting.');
      return;
    }

    try {
      setError('');
      await confirmSnapSOS({
        analysisId: analysis.analysisId,
        type,
        description,
        contactNumber: contactNumber || undefined,
      }).unwrap();
      navigate('/my-sos', { state: { message: 'Snap SOS submitted successfully.' } });
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.message || 'Failed to confirm Snap SOS. Please try again.');
    }
  };

  const confidence = analysis ? confidenceLabel(analysis.confidenceScore) : null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="primary.dark">
          Snap SOS
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Upload a disaster image, review the model suggestion, then confirm before sending it as an SOS.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {locationError && <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>{locationError}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Capture evidence
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Snap SOS works best with clear photos that show the incident itself.
                  </Typography>
                </Box>

                <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ textTransform: 'none' }}>
                  {selectedFile ? 'Replace Image' : 'Upload Image'}
                  <input hidden type="file" accept="image/*" onChange={handleFileChange} />
                </Button>

                {previewUrl ? (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Snap SOS preview"
                    sx={{ width: '100%', borderRadius: 2, objectFit: 'cover', maxHeight: 320 }}
                  />
                ) : (
                  <Box
                    sx={{
                      border: '1px dashed #cbd5e1',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    <CameraIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">Choose a disaster image to begin analysis.</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Current location
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {location.address || `${location.coordinates[1]?.toFixed(5)}, ${location.coordinates[0]?.toFixed(5)}`}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={isAnalyzing ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {isAnalyzing ? 'Analyzing image...' : 'Analyze Image'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              {!analysis ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    Review panel
                  </Typography>
                  <Typography variant="body2">
                    Run analysis to see the predicted incident type, confidence, weather context, and review controls.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Model prediction: {analysis.predictedClass}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Model version {analysis.modelVersion}
                      </Typography>
                    </Box>
                    {confidence && (
                      <Chip
                        label={`${confidence.label} (${Math.round(analysis.confidenceScore * 100)}%)`}
                        color={confidence.color}
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" fontWeight={700}>Weather context</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {analysis.weatherContext?.summary || 'No weather context available'}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Temp {analysis.weatherContext?.temperatureC ?? '--'}°C • Wind {analysis.weatherContext?.windSpeedKph ?? '--'} km/h • Rain {analysis.weatherContext?.precipitationMm ?? '--'} mm
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" fontWeight={700}>Crowd signal</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {analysis.clusterPreview
                              ? `${analysis.clusterPreview.uniqueReporterCount || 0} unique reporters and ${analysis.clusterPreview.reportCount || 0} related reports nearby.`
                              : 'No nearby matching incident cluster yet.'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      Confidence breakdown
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={`Model ${Math.round(analysis.confidenceBreakdown.model * 100)}%`} />
                      <Chip label={`Weather ${Math.round(analysis.confidenceBreakdown.weather * 100)}%`} />
                      <Chip label={`Crowd ${Math.round(analysis.confidenceBreakdown.crowd * 100)}%`} />
                      <Chip label={`Quality ${Math.round(analysis.confidenceBreakdown.quality * 100)}%`} />
                      <Chip label={`Trust ${Math.round((analysis.confidenceBreakdown.trust || analysis.trustScore) * 100)}%`} />
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      Trust summary
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={`User ${Math.round(analysis.trustBreakdown.userTrust * 100)}%`} variant="outlined" />
                      <Chip label={`EXIF location ${Math.round(analysis.trustBreakdown.exifLocationMatch * 100)}%`} variant="outlined" />
                      <Chip label={`EXIF time ${Math.round(analysis.trustBreakdown.exifTimestampFreshness * 100)}%`} variant="outlined" />
                      <Chip label={`Duplicate check ${Math.round(analysis.trustBreakdown.duplicateImageScore * 100)}%`} variant="outlined" />
                      <Chip label={`Cap ${Math.round(analysis.confidenceCap * 100)}%`} variant="outlined" />
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      Class probabilities
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {sortedProbabilities.map(([label, score]) => (
                        <Chip key={label} label={`${label} ${Math.round(score * 100)}%`} variant="outlined" />
                      ))}
                    </Stack>
                  </Box>

                  <Divider />

                  <TextField
                    select
                    label="Confirmed incident type"
                    value={type}
                    onChange={(event) => setType(event.target.value as SOSType)}
                    fullWidth
                  >
                    {snapTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Description"
                    multiline
                    minRows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    fullWidth
                  />

                  <TextField
                    label="Contact number"
                    value={contactNumber}
                    onChange={(event) => setContactNumber(event.target.value)}
                    fullWidth
                  />

                  <Stack spacing={1.5}>
                    <Alert severity={analysis.reviewStatus === 'normal-review' ? 'warning' : 'info'} sx={{ borderRadius: 2 }}>
                      {analysis.reviewStatus === 'normal-review'
                        ? 'This report is being treated cautiously. Review carefully before submitting.'
                        : 'Review the suggested type and description before sending the final SOS.'}
                    </Alert>
                    {trustWarnings.map((warning) => (
                      <Alert key={warning} severity="warning" sx={{ borderRadius: 2 }}>
                        {warning}
                      </Alert>
                    ))}
                  </Stack>

                  <Button
                    variant="contained"
                    color="error"
                    startIcon={isConfirming ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {isConfirming ? 'Submitting...' : 'Confirm Snap SOS'}
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
