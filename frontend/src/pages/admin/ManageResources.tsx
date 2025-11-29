import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
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
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LocalHospital as HospitalIcon,
  Home as ShelterIcon,
  LocalFireDepartment as FireIcon,
  LocalPolice as PoliceIcon,
  Groups as CommunityIcon,
} from '@mui/icons-material';
import {
  useGetResourcesQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
} from '../../app/api';
import type { ResourceType, Resource, CreateResourceRequest, ApiError } from '../../types';

const resourceTypes: { value: ResourceType; label: string; icon: React.ReactNode }[] = [
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

const initialFormData: CreateResourceRequest = {
  name: '',
  type: 'hospital',
  address: '',
  city: '',
  state: '',
  pincode: '',
  lat: 0,
  lng: 0,
  phone: '',
  email: '',
  website: '',
  services: [],
  capacity: undefined,
  operatingHours: '24/7',
};

export default function ManageResources() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<CreateResourceRequest>(initialFormData);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useGetResourcesQuery();
  const [createResource, { isLoading: isCreating }] = useCreateResourceMutation();
  const [updateResource, { isLoading: isUpdating }] = useUpdateResourceMutation();
  const [deleteResource, { isLoading: isDeleting }] = useDeleteResourceMutation();

  const resources = data?.data || [];

  const handleOpenCreate = () => {
    setEditingResource(null);
    setFormData(initialFormData);
    setFormError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      address: resource.location?.address || '',
      city: resource.location?.city || '',
      state: resource.location?.state || '',
      pincode: resource.location?.pincode || '',
      lat: resource.location?.coordinates?.[1] || 0,
      lng: resource.location?.coordinates?.[0] || 0,
      phone: resource.contact?.phone || '',
      email: resource.contact?.email || '',
      website: resource.contact?.website || '',
      services: resource.services || [],
      capacity: resource.capacity,
      operatingHours: resource.operatingHours || '24/7',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingResource(null);
    setFormData(initialFormData);
    setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!formData.name || !formData.type || !formData.address || !formData.phone) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (!formData.lat || !formData.lng) {
      setFormError('Please provide latitude and longitude');
      return;
    }

    try {
      if (editingResource) {
        await updateResource({
          id: editingResource._id,
          data: formData,
        }).unwrap();
      } else {
        await createResource(formData).unwrap();
      }
      handleCloseDialog();
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setFormError(apiError.data?.message || 'Failed to save resource');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource(id).unwrap();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete resource:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.dark">
            Manage Resources
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Add, edit, and manage emergency resources
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
            onClick={handleOpenCreate}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Add Resource
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Failed to load resources. Please try again.
        </Alert>
      )}

      {/* Resources Grid */}
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
            <Card sx={{ borderRadius: 3, p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No resources found
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{ mt: 2, textTransform: 'none' }}
              >
                Add First Resource
              </Button>
            </Card>
          </Grid>
        ) : (
          resources.map((resource: Resource) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={resource._id}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
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
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEdit(resource)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteConfirm(resource._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Info */}
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {resource.name}
                  </Typography>
                  <Chip
                    label={resource.type.replace('-', ' ')}
                    size="small"
                    sx={{ mb: 2, textTransform: 'capitalize' }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {resource.location?.address}
                    {resource.location?.city && `, ${resource.location.city}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📞 {resource.contact?.phone}
                  </Typography>
                  {resource.capacity && (
                    <Typography variant="body2" color="text.secondary">
                      Capacity: {resource.currentOccupancy || 0}/{resource.capacity}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingResource ? 'Edit Resource' : 'Add New Resource'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Type *</InputLabel>
                <Select
                  value={formData.type}
                  label="Type *"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
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
            <Grid size={12}>
              <TextField
                fullWidth
                label="Address *"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Latitude *"
                type="number"
                value={formData.lat || ''}
                onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Longitude *"
                type="number"
                value={formData.lng || ''}
                onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Operating Hours"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                placeholder="e.g., 24/7, Mon-Fri 9AM-5PM"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? 'Saving...' : editingResource ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this resource? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


