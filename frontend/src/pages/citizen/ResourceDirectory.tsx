import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Slider,
} from '@mui/material';
import {
  Search as SearchIcon,
  MyLocation as LocationIcon,
  LocalHospital as HospitalIcon,
  Home as ShelterIcon,
  LocalFireDepartment as FireIcon,
  LocalPolice as PoliceIcon,
  Groups as CommunityIcon,
  Phone as PhoneIcon,
  OpenInNew as OpenIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useGetResourcesQuery } from '../../app/api';
import type { ResourceType, Resource } from '../../types';

const resourceTypes: { value: ResourceType | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Types', icon: null },
  { value: 'hospital', label: 'Hospital', icon: <HospitalIcon /> },
  { value: 'shelter', label: 'Shelter', icon: <ShelterIcon /> },
  { value: 'fire-station', label: 'Fire Station', icon: <FireIcon /> },
  { value: 'police-station', label: 'Police Station', icon: <PoliceIcon /> },
  { value: 'community-center', label: 'Community Center', icon: <CommunityIcon /> },
  { value: 'relief-camp', label: 'Relief Camp', icon: <ShelterIcon /> },
];

const typeIcons: Record<ResourceType, React.ReactNode> = {
  hospital: <HospitalIcon />,
  shelter: <ShelterIcon />,
  'fire-station': <FireIcon />,
  'police-station': <PoliceIcon />,
  'community-center': <CommunityIcon />,
  'relief-camp': <ShelterIcon />,
};

export default function ResourceDirectory() {
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10);
  const [useNearby, setUseNearby] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const { data, isLoading, error, refetch } = useGetResourcesQuery(
    {
      type: typeFilter === 'all' ? undefined : typeFilter,
      search: searchQuery || undefined,
      lat: useNearby && userLocation ? userLocation.lat : undefined,
      lng: useNearby && userLocation ? userLocation.lng : undefined,
      radius: useNearby ? radius : undefined,
    },
    { refetchOnMountOrArgChange: true }
  );

  const resources = data?.data || [];

  const getLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
        setUseNearby(true);
      },
      () => {
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    // Try to get location on mount
    getLocation();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="primary.dark">
          Resource Directory
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Find nearby hospitals, shelters, and emergency services
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Resource Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Resource Type"
                  onChange={(e) => setTypeFilter(e.target.value as ResourceType | 'all')}
                  sx={{ borderRadius: 2 }}
                >
                  {resourceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                fullWidth
                variant={useNearby ? 'contained' : 'outlined'}
                startIcon={locationLoading ? null : <LocationIcon />}
                onClick={() => {
                  if (!userLocation) {
                    getLocation();
                  } else {
                    setUseNearby(!useNearby);
                  }
                }}
                disabled={locationLoading}
                sx={{ borderRadius: 2, py: 1.8, textTransform: 'none' }}
              >
                {locationLoading ? 'Getting Location...' : useNearby ? 'Nearby Active' : 'Use My Location'}
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Tooltip title="Refresh">
                <IconButton onClick={() => refetch()} color="primary" size="large">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Grid>

            {/* Radius Slider */}
            {useNearby && userLocation && (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Search Radius: {radius} km
                </Typography>
                <Slider
                  value={radius}
                  onChange={(_, v) => setRadius(v as number)}
                  min={1}
                  max={50}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v} km`}
                  sx={{ maxWidth: 400 }}
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Failed to load resources. Please try again.
        </Alert>
      )}

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isLoading ? 'Loading...' : `Showing ${resources.length} resource${resources.length !== 1 ? 's' : ''}`}
      </Typography>

      {/* Resource List */}
      <Grid container spacing={3}>
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
                  <Skeleton variant="text" height={30} width="70%" />
                  <Skeleton variant="text" height={20} width="50%" />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : resources.length === 0 ? (
          <Grid size={12}>
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h6" color="text.secondary">
                No resources found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your search filters or expanding the search radius
              </Typography>
            </Paper>
          </Grid>
        ) : (
          resources.map((resource: Resource) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={resource._id}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundColor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                      }}
                    >
                      {typeIcons[resource.type]}
                    </Box>
                    <Chip
                      label={resource.type.replace('-', ' ')}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>

                  {/* Name & Address */}
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {resource.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {resource.location?.address}
                    {resource.location?.city && `, ${resource.location.city}`}
                  </Typography>

                  {/* Services */}
                  {resource.services && resource.services.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {resource.services.slice(0, 3).map((service, i) => (
                        <Chip key={i} label={service} size="small" variant="outlined" />
                      ))}
                      {resource.services.length > 3 && (
                        <Chip label={`+${resource.services.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  )}

                  {/* Operating Hours & Capacity */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {resource.operatingHours || '24/7'}
                    </Typography>
                    {resource.capacity && (
                      <Typography variant="caption" color="text.secondary">
                        Capacity: {resource.currentOccupancy || 0}/{resource.capacity}
                      </Typography>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PhoneIcon />}
                      href={`tel:${resource.contact?.phone}`}
                      sx={{ flex: 1, textTransform: 'none', borderRadius: 2 }}
                    >
                      Call
                    </Button>
                    <Tooltip title="View on Map">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps?q=${resource.location?.coordinates[1]},${resource.location?.coordinates[0]}`,
                            '_blank'
                          )
                        }
                      >
                        <OpenIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}


