import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Directions as DirectionsIcon,
  Launch as LaunchIcon,
  Map as MapIcon,
  MyLocation as FocusIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useGetOutbreakMapQuery } from '../../app/api';
import type {
  OutbreakMapIncident,
  OutbreakMapParams,
  SOSSeverity,
  SOSStatus,
  SOSType,
} from '../../types';

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const SEVERITY_WEIGHT: Record<SOSSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
const SEVERITY_COLOR: Record<SOSSeverity, [number, number, number, number]> = {
  low: [34, 197, 94, 190],
  medium: [245, 158, 11, 210],
  high: [249, 115, 22, 220],
  critical: [220, 38, 38, 240],
};
const DISASTER_TYPES: Array<SOSType | 'all'> = ['all', 'earthquake', 'fire', 'flood', 'landslide', 'smoke', 'normal'];
const SEVERITIES: Array<SOSSeverity | 'all'> = ['all', 'low', 'medium', 'high', 'critical'];
const STATUSES: Array<SOSStatus | 'active'> = ['active', 'pending', 'acknowledged', 'in-progress', 'resolved'];

type SourceFilter = 'all' | 'manual' | 'snap';
type TimeRange = '6h' | '24h' | '7d';

function getFromDate(range: TimeRange) {
  const now = Date.now();
  const hours = range === '6h' ? 6 : range === '7d' ? 24 * 7 : 24;
  return new Date(now - hours * 60 * 60 * 1000).toISOString();
}

function formatDate(value?: string) {
  if (!value) return 'No reports';

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function titleCase(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getIncidentWeight(incident: OutbreakMapIncident) {
  return SEVERITY_WEIGHT[incident.severity] * ((incident.confidenceScore ?? 70) / 100);
}

function googleMapsSearchUrl(incident: OutbreakMapIncident) {
  const [lng, lat] = incident.coordinates;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function googleMapsDirectionsUrl(incident: OutbreakMapIncident) {
  const [lng, lat] = incident.coordinates;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function DetailContent({
  incident,
  onClose,
}: {
  incident: OutbreakMapIncident;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const locationText = [incident.address, incident.city, incident.state].filter(Boolean).join(', ');

  return (
    <Box sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {titleCase(incident.type)} Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(incident.createdAt)}
          </Typography>
        </Box>
        <Chip label={incident.severity} color={incident.severity === 'critical' ? 'error' : 'warning'} size="small" />
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
        <Chip label={incident.status} size="small" variant="outlined" />
        <Chip label={incident.source} size="small" variant="outlined" />
        {incident.confidenceScore !== undefined && (
          <Chip label={`${Math.round(incident.confidenceScore)}% confidence`} size="small" variant="outlined" />
        )}
      </Stack>

      <Typography variant="body2" sx={{ mt: 2 }}>
        {incident.description}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {locationText || `${incident.coordinates[1].toFixed(5)}, ${incident.coordinates[0].toFixed(5)}`}
      </Typography>

      {incident.reporter && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Reporter
          </Typography>
          <Typography variant="body2">
            {incident.reporter.name || 'Unknown'} {incident.reporter.phone ? `• ${incident.reporter.phone}` : ''}
          </Typography>
        </Box>
      )}

      <Stack spacing={1.2} sx={{ mt: 3 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<LaunchIcon />}
          href={googleMapsSearchUrl(incident)}
          target="_blank"
          rel="noreferrer"
        >
          Open in Google Maps
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<DirectionsIcon />}
          href={googleMapsDirectionsUrl(incident)}
          target="_blank"
          rel="noreferrer"
        >
          Get Directions
        </Button>
        <Button
          fullWidth
          variant="text"
          startIcon={<ViewIcon />}
          onClick={() => navigate(`/admin/sos/${incident.id}`)}
        >
          View SOS
        </Button>
        <Button fullWidth variant="text" color="inherit" onClick={onClose}>
          Close
        </Button>
      </Stack>
    </Box>
  );
}

export default function OutbreakMap() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  const hasFitBoundsRef = useRef(false);
  const [selectedIncident, setSelectedIncident] = useState<OutbreakMapIncident | null>(null);
  const [mapError, setMapError] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [type, setType] = useState<SOSType | 'all'>('all');
  const [severity, setSeverity] = useState<SOSSeverity | 'all'>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [status, setStatus] = useState<SOSStatus | 'active'>('active');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const params = useMemo<OutbreakMapParams>(
    () => ({
      type,
      severity: severity === 'all' ? undefined : severity,
      source: source === 'all' ? undefined : source,
      status,
      from: getFromDate(timeRange),
      limit: 1000,
    }),
    [severity, source, status, timeRange, type]
  );

  const { data, error, isFetching, refetch } = useGetOutbreakMapQuery(params, {
    pollingInterval: 30000,
  });

  const incidents = data?.data.incidents || [];
  const stats = data?.data.stats;
  const topType = stats?.byType?.slice().sort((a, b) => b.count - a.count)[0];
  const criticalCount = stats?.bySeverity?.find((item) => item.severity === 'critical')?.count || 0;

  useEffect(() => {
    if (!apiKey || !mapElementRef.current || mapRef.current) return;

    setOptions({
      key: apiKey,
      v: 'weekly',
    });

    importLibrary('maps')
      .then(({ Map }) => {
        if (!mapElementRef.current) return;

        const map = new Map(mapElementRef.current, {
          center: INDIA_CENTER,
          zoom: 5,
          disableDefaultUI: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          clickableIcons: false,
        });

        const overlay = new GoogleMapsOverlay({ layers: [] });
        overlay.setMap(map);
        mapRef.current = map;
        overlayRef.current = overlay;
        setMapReady(true);
      })
      .catch(() => {
        setMapError('Google Maps failed to load. Check the API key and Maps JavaScript API configuration.');
      });

    return () => {
      overlayRef.current?.finalize();
      overlayRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!overlayRef.current) return;

    overlayRef.current.setProps({
      layers: [
        new HeatmapLayer<OutbreakMapIncident>({
          id: 'outbreak-heatmap',
          data: incidents,
          getPosition: (incident) => incident.coordinates,
          getWeight: getIncidentWeight,
          radiusPixels: 48,
          intensity: 1,
          threshold: 0.03,
        }),
        new ScatterplotLayer<OutbreakMapIncident>({
          id: 'outbreak-points',
          data: incidents,
          pickable: true,
          filled: true,
          stroked: true,
          radiusMinPixels: 7,
          radiusMaxPixels: 18,
          lineWidthMinPixels: 2,
          getPosition: (incident) => incident.coordinates,
          getRadius: (incident) => 80 + SEVERITY_WEIGHT[incident.severity] * 45,
          getFillColor: (incident) => SEVERITY_COLOR[incident.severity],
          getLineColor: [255, 255, 255, 230],
          onClick: (info) => {
            if (info.object) setSelectedIncident(info.object);
          },
        }),
      ],
    });
  }, [incidents]);

  useEffect(() => {
    if (!mapRef.current || !incidents.length || hasFitBoundsRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    incidents.forEach((incident) => {
      const [lng, lat] = incident.coordinates;
      bounds.extend({ lat, lng });
    });
    mapRef.current.fitBounds(bounds, 64);
    hasFitBoundsRef.current = true;
  }, [incidents]);

  const focusIncidents = () => {
    if (!mapRef.current || !incidents.length) return;

    const bounds = new google.maps.LatLngBounds();
    incidents.forEach((incident) => {
      const [lng, lat] = incident.coordinates;
      bounds.extend({ lat, lng });
    });
    mapRef.current.fitBounds(bounds, 64);
  };

  if (!apiKey) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Set VITE_GOOGLE_MAPS_API_KEY in the frontend environment to enable the outbreak map.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 80px)' }, position: 'relative', overflow: 'hidden' }}>
      <Box ref={mapElementRef} sx={{ position: 'absolute', inset: 0 }} />

      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: { xs: 12, md: selectedIncident ? 388 : 12 },
          p: 1.5,
          borderRadius: 2,
          transition: 'right 180ms ease',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} noWrap>
              Disaster Outbreak Map
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {isFetching ? 'Updating live map...' : `Updated ${formatDate(data?.data.generatedAt)}`}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={focusIncidents} disabled={!incidents.length} size="small" color="primary">
              <FocusIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => refetch()} size="small" color="primary">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
          <FormControl size="small" sx={{ minWidth: 132 }}>
            <InputLabel>Type</InputLabel>
            <Select value={type} label="Type" onChange={(event) => setType(event.target.value as SOSType | 'all')}>
              {DISASTER_TYPES.map((value) => (
                <MenuItem key={value} value={value}>
                  {value === 'all' ? 'All Types' : titleCase(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 128 }}>
            <InputLabel>Severity</InputLabel>
            <Select value={severity} label="Severity" onChange={(event) => setSeverity(event.target.value as SOSSeverity | 'all')}>
              {SEVERITIES.map((value) => (
                <MenuItem key={value} value={value}>
                  {value === 'all' ? 'All Severity' : titleCase(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 122 }}>
            <InputLabel>Source</InputLabel>
            <Select value={source} label="Source" onChange={(event) => setSource(event.target.value as SourceFilter)}>
              <MenuItem value="all">All Sources</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
              <MenuItem value="snap">Snap</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 136 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value as SOSStatus | 'active')}>
              {STATUSES.map((value) => (
                <MenuItem key={value} value={value}>
                  {titleCase(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 112 }}>
            <InputLabel>Time</InputLabel>
            <Select value={timeRange} label="Time" onChange={(event) => setTimeRange(event.target.value as TimeRange)}>
              <MenuItem value="6h">Last 6h</MenuItem>
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7d</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.25, overflowX: 'auto', pb: 0.25 }}>
          <Chip size="small" icon={<MapIcon />} label={`${stats?.total || 0} active reports`} />
          <Chip size="small" color={criticalCount ? 'error' : 'default'} label={`${criticalCount} critical`} />
          <Chip size="small" label={`Top: ${topType ? titleCase(topType.type) : 'None'}`} />
          <Chip size="small" label={`Latest: ${formatDate(stats?.latestReportAt)}`} />
        </Stack>
      </Paper>

      {(mapError || error) && (
        <Alert
          severity="error"
          sx={{ position: 'absolute', left: 12, right: { xs: 12, md: selectedIncident ? 388 : 12 }, bottom: 16, borderRadius: 2 }}
        >
          {mapError || 'Failed to load outbreak reports. Please try again.'}
        </Alert>
      )}

      {!mapReady && !mapError && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <CircularProgress />
        </Box>
      )}

      {mapReady && !isFetching && incidents.length === 0 && !error && (
        <Paper
          elevation={2}
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: 24,
            transform: 'translateX(-50%)',
            px: 2,
            py: 1.2,
            borderRadius: 2,
            width: { xs: 'calc(100% - 32px)', sm: 'auto' },
            textAlign: 'center',
          }}
        >
          <Typography variant="body2">No active disaster reports in the selected window.</Typography>
        </Paper>
      )}

      {isDesktop ? (
        selectedIncident && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 376,
              borderRadius: 0,
              overflowY: 'auto',
            }}
          >
            <DetailContent incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
          </Paper>
        )
      ) : (
        <Drawer
          anchor="bottom"
          open={Boolean(selectedIncident)}
          onClose={() => setSelectedIncident(null)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '78vh',
            },
          }}
        >
          {selectedIncident && <DetailContent incident={selectedIncident} onClose={() => setSelectedIncident(null)} />}
        </Drawer>
      )}
    </Box>
  );
}
