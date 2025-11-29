import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Tooltip,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectCurrentUser, selectIsAdmin } from '../../features/auth/authSlice';
import { useLogoutMutation, useGetAlertsQuery } from '../../app/api';
import { showSuccess, showError } from '../../features/notification/notificationSlice';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  const [logout] = useLogoutMutation();
  const { data: alertsData } = useGetAlertsQuery();

  const alerts = alertsData?.data || [];
  const unreadAlerts = alerts.filter(
    (alert) => !alert.readBy?.includes(user?.id || '')
  ).length;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifMenuClose = () => {
    setNotifAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    try {
      await logout().unwrap();
      dispatch(showSuccess('Logged out successfully'));
      navigate('/login');
    } catch {
      dispatch(showError('Failed to logout'));
    }
  };

  const handleViewAlerts = () => {
    handleNotifMenuClose();
    navigate(isAdmin ? '/admin/alert-history' : '/alerts');
  };

  const DRAWER_WIDTH = 260;

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: 'white',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        {/* Menu Button */}
        <IconButton
          edge="start"
          color="inherit"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Tooltip title="Alerts">
            <IconButton color="inherit" onClick={handleNotifMenuOpen}>
              <Badge badgeContent={unreadAlerts} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Tooltip title="Account">
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: '#0284c7',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'inline-block',
                mt: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: isAdmin ? 'primary.light' : 'success.light',
                color: isAdmin ? 'primary.dark' : 'success.dark',
                textTransform: 'capitalize',
              }}
            >
              {user?.role || 'Citizen'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 300,
              maxWidth: 360,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Alerts
            </Typography>
            {unreadAlerts > 0 && (
              <Typography variant="caption" color="error">
                {unreadAlerts} new
              </Typography>
            )}
          </Box>
          <Divider />
          {alerts.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No alerts
              </Typography>
            </Box>
          ) : (
            <>
              {alerts.slice(0, 3).map((alert) => (
                <MenuItem key={alert._id} onClick={handleViewAlerts} sx={{ py: 1.5 }}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" noWrap>
                      {alert.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {alert.message}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={handleViewAlerts} sx={{ justifyContent: 'center' }}>
                <Typography variant="body2" color="primary">
                  View all alerts
                </Typography>
              </MenuItem>
            </>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

