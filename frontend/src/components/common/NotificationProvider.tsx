import { useEffect } from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectNotifications, removeNotification } from '../../features/notification/notificationSlice';

export default function NotificationProvider() {
  const notifications = useAppSelector(selectNotifications);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Auto-remove notifications after their duration
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);

  const handleClose = (id: string) => {
    dispatch(removeNotification(id));
  };

  const getAlertSeverity = (type: string): AlertColor => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ position: 'relative', mb: 1 }}
        >
          <Alert
            severity={getAlertSeverity(notification.type)}
            onClose={() => handleClose(notification.id)}
            sx={{
              width: '100%',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}

