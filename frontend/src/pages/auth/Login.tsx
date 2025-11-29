import { useState, FormEvent } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useLoginMutation, useLazyGetProfileQuery } from '../../app/api';
import { useAppSelector } from '../../app/hooks';
import { selectIsAuthenticated, selectCurrentUser } from '../../features/auth/authSlice';
import type { ApiError } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [getProfile] = useLazyGetProfileQuery();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const from = (location.state as { from?: Location })?.from?.pathname || 
      (user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    navigate(from, { replace: true });
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const result = await login(formData).unwrap();
      
      // Refetch profile to update auth state
      await getProfile().unwrap();
      
      // Redirect based on role
      const from = (location.state as { from?: Location })?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate(result.user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
      }
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo/Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/suraksha-setu-brand-logo-2.png"
              alt="Suraksha Setu"
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                margin: '0 auto 16px',
                objectFit: 'cover',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1a1a2e',
                fontFamily: '"Poppins", sans-serif',
                letterSpacing: '-0.5px',
              }}
            >
              Suraksha Setu
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sign in to your account
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Email or Username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              margin="normal"
              required
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                backgroundColor: '#1e293b',
                boxShadow: '0 4px 15px rgba(30, 41, 59, 0.4)',
                '&:hover': {
                  backgroundColor: '#0f172a',
                  boxShadow: '0 6px 20px rgba(30, 41, 59, 0.5)',
                },
                '&:disabled': {
                  background: '#ccc',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: '#1e293b',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#0f172a',
                    },
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

