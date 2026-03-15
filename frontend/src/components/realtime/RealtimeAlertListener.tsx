import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { baseApi } from '../../app/api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '../../features/auth/authSlice';
import { showWarning } from '../../features/notification/notificationSlice';

type AlertCreatedPayload = {
  alert: {
    _id: string;
    title: string;
    message: string;
  };
};

type AlertDeactivatedPayload = {
  alertId: string;
};

function getSocketUrl() {
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.startsWith('http')) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
  }

  return window.location.origin;
}

export default function RealtimeAlertListener() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('alert:created', ({ alert }: AlertCreatedPayload) => {
      dispatch(
        showWarning(`New alert: ${alert.title}`, 7000)
      );
      dispatch(
        baseApi.util.invalidateTags([
          { type: 'Alert', id: 'LIST' },
          { type: 'Alert', id: 'HISTORY' },
          'Dashboard',
        ])
      );
    });

    socket.on('alert:deactivated', (_payload: AlertDeactivatedPayload) => {
      dispatch(
        baseApi.util.invalidateTags([
          { type: 'Alert', id: 'LIST' },
          { type: 'Alert', id: 'HISTORY' },
          'Dashboard',
        ])
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, isAuthenticated, user]);

  return null;
}
