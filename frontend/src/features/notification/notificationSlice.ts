import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // in ms, default 5000
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

let notificationIdCounter = 0;

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: {
      reducer: (state, action: PayloadAction<Notification>) => {
        state.notifications.push(action.payload);
      },
      prepare: (notification: Omit<Notification, 'id'>) => ({
        payload: {
          ...notification,
          id: `notification-${++notificationIdCounter}-${Date.now()}`,
          duration: notification.duration ?? 5000,
        },
      }),
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, clearAllNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: { notification: NotificationState }) =>
  state.notification.notifications;

// Convenience action creators
export const showSuccess = (message: string, duration?: number) =>
  addNotification({ type: 'success', message, duration });

export const showError = (message: string, duration?: number) =>
  addNotification({ type: 'error', message, duration: duration ?? 7000 });

export const showWarning = (message: string, duration?: number) =>
  addNotification({ type: 'warning', message, duration });

export const showInfo = (message: string, duration?: number) =>
  addNotification({ type: 'info', message, duration });

