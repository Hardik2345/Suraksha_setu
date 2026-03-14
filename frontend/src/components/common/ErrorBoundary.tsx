import React from 'react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  fullScreen?: boolean;
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundaryInner extends React.Component<ErrorBoundaryProps & {
  onGoHome?: () => void;
  onGoBack?: () => void;
}, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps & { onGoHome?: () => void; onGoBack?: () => void }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught a render failure:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { children, title, description, fullScreen = false, onGoBack, onGoHome } = this.props;
    const { error } = this.state;

    if (!error) {
      return children;
    }

    return (
      <Box
        sx={{
          minHeight: fullScreen ? '100vh' : 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          backgroundColor: fullScreen ? '#f8fafc' : 'transparent',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 640, borderRadius: 3, border: '1px solid', borderColor: 'error.light' }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="overline" sx={{ color: 'error.main', fontWeight: 700, letterSpacing: 1.2 }}>
                  Unexpected Error
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: 'text.primary' }}>
                  {title || 'This part of the application failed to load.'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  {description || 'You can retry this screen. If the problem continues, navigate away and try again later.'}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: '#fff7ed',
                  border: '1px solid',
                  borderColor: '#fdba74',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#9a3412', mb: 0.5 }}>
                  Failure details
                </Typography>
                <Typography variant="body2" sx={{ color: '#7c2d12', wordBreak: 'break-word' }}>
                  {error.message || 'Unknown render error'}
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="contained" color="error" onClick={this.handleRetry}>
                  Retry
                </Button>
                {onGoBack && (
                  <Button variant="outlined" onClick={onGoBack}>
                    Go Back
                  </Button>
                )}
                {onGoHome && (
                  <Button variant="outlined" onClick={onGoHome}>
                    Go To Dashboard
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }
}

interface RoutedErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'resetKey'> {
  resetOnPathChange?: boolean;
}

export function RoutedErrorBoundary({
  children,
  title,
  description,
  fullScreen,
  resetOnPathChange = true,
}: RoutedErrorBoundaryProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ErrorBoundaryInner
      title={title}
      description={description}
      fullScreen={fullScreen}
      resetKey={resetOnPathChange ? location.pathname : undefined}
      onGoBack={() => navigate(-1)}
      onGoHome={() => navigate('/dashboard')}
    >
      {children}
    </ErrorBoundaryInner>
  );
}

export function AppErrorBoundary({
  children,
  title,
  description,
}: Omit<ErrorBoundaryProps, 'resetKey' | 'fullScreen'>) {
  return (
    <ErrorBoundaryInner
      title={title || 'The application hit an unexpected error.'}
      description={description || 'The current view could not be rendered. You can retry or navigate to a safe screen.'}
      fullScreen
      onGoHome={() => window.location.assign('/dashboard')}
    >
      {children}
    </ErrorBoundaryInner>
  );
}
