import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Warning as SOSIcon,
  Add as AddIcon,
  LocalHospital as ResourceIcon,
  Notifications as AlertIcon,
  Campaign as BroadcastIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser, selectIsAdmin } from '../../features/auth/authSlice';

const DRAWER_WIDTH = 260;

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const citizenMenuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Report Emergency', path: '/create-sos', icon: <AddIcon /> },
  { label: 'My Reports', path: '/my-sos', icon: <SOSIcon /> },
  { label: 'Resources', path: '/resources', icon: <ResourceIcon /> },
  { label: 'Alerts', path: '/alerts', icon: <AlertIcon /> },
];

const adminMenuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { label: 'All SOS Reports', path: '/admin/sos', icon: <SOSIcon /> },
  { label: 'Manage Resources', path: '/admin/resources', icon: <ResourceIcon /> },
  { label: 'Broadcast Alert', path: '/admin/broadcast', icon: <BroadcastIcon /> },
  { label: 'Alert History', path: '/admin/alert-history', icon: <HistoryIcon /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

export default function Sidebar({ open, onClose, variant = 'temporary' }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);

  const menuItems = isAdmin ? adminMenuItems : citizenMenuItems;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo - Height matches header (64px) */}
      <Box
        sx={{
          height: 64,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          component="img"
          src="/suraksha-setu-brand-logo.jpg"
          alt="Suraksha Setu"
          sx={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            objectFit: 'cover',
          }}
        />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, color: '#ffffff' }}>
            Suraksha Setu
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            {isAdmin ? 'Admin Portal' : 'Citizen Portal'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#334155' }} />

      {/* Menu Items */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#ffffff' : '#94a3b8',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#ffffff' : '#cbd5e1',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#334155' }} />

      {/* User Info */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 1,
            px: 1.5,
            borderRadius: 1.5,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.875rem',
              backgroundColor: '#0284c7',
              fontWeight: 600,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#ffffff' }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" noWrap sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {user?.email || ''}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b',
          borderRight: 'none',
        },
      }}
    >
      {drawer}
    </Drawer>
  );
}

