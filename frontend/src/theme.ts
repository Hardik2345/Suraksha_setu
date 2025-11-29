import { createTheme } from '@mui/material/styles';

// Suraksha Setu custom theme - disaster management platform
// Professional colors for emergency management
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e293b',      // Dark slate - sidebar
      light: '#f1f5f9',     // Light gray
      dark: '#0f172a',      // Darker slate
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ea580c',      // Orange - primary action
      light: '#fed7aa',
      dark: '#c2410c',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ea580c',      // Orange for high severity
      light: '#ffedd5',
      dark: '#c2410c',
    },
    warning: {
      main: '#f97316',      // Orange - pending/warning
      light: '#ffedd5',
      dark: '#ea580c',
    },
    info: {
      main: '#0284c7',      // Blue - in progress
      light: '#e0f2fe',
      dark: '#0369a1',
    },
    success: {
      main: '#16a34a',      // Green - resolved
      light: '#dcfce7',
      dark: '#15803d',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 1px 3px rgba(0,0,0,0.1)',
    '0 4px 6px rgba(0,0,0,0.07)',
    '0 4px 8px rgba(0,0,0,0.1)',
    '0 6px 10px rgba(0,0,0,0.08)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 20px rgba(0,0,0,0.12)',
    '0 12px 24px rgba(0,0,0,0.1)',
    '0 12px 28px rgba(0,0,0,0.12)',
    '0 14px 32px rgba(0,0,0,0.1)',
    '0 16px 36px rgba(0,0,0,0.12)',
    '0 18px 40px rgba(0,0,0,0.1)',
    '0 20px 44px rgba(0,0,0,0.12)',
    '0 22px 48px rgba(0,0,0,0.1)',
    '0 24px 52px rgba(0,0,0,0.12)',
    '0 26px 56px rgba(0,0,0,0.1)',
    '0 28px 60px rgba(0,0,0,0.12)',
    '0 30px 64px rgba(0,0,0,0.1)',
    '0 32px 68px rgba(0,0,0,0.12)',
    '0 34px 72px rgba(0,0,0,0.1)',
    '0 36px 76px rgba(0,0,0,0.12)',
    '0 38px 80px rgba(0,0,0,0.1)',
    '0 40px 84px rgba(0,0,0,0.12)',
    '0 42px 88px rgba(0,0,0,0.1)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;

