import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { RoutedErrorBoundary } from '../common/ErrorBoundary';

const DRAWER_WIDTH = 260;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar - Permanent on desktop, temporary on mobile */}
      {isMobile ? (
        <Sidebar
          open={mobileOpen}
          onClose={handleDrawerToggle}
          variant="temporary"
        />
      ) : (
        <Sidebar
          open={true}
          onClose={() => {}}
          variant="permanent"
        />
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          transition: 'width 0.3s ease',
        }}
      >
        {/* Header */}
        <Header onMenuClick={handleDrawerToggle} />

        {/* Page Content */}
        <Box
          sx={{
            pt: '64px', // Header height
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          <RoutedErrorBoundary
            title="This screen ran into a problem."
            description="The rest of the app is still available. Retry this page or move to another screen."
          >
            <Outlet />
          </RoutedErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
