import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../app/api/authApi';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Has the app tried to load the profile?
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Handle login success
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.user = {
          id: payload.user.id,
          name: payload.user.name,
          email: payload.user.email,
          role: payload.user.role,
        };
        state.isAuthenticated = true;
        state.isLoading = false;
      }
    );

    // Handle login pending
    builder.addMatcher(authApi.endpoints.login.matchPending, (state) => {
      state.isLoading = true;
    });

    // Handle login rejected
    builder.addMatcher(authApi.endpoints.login.matchRejected, (state) => {
      state.isLoading = false;
    });

    // Handle logout success
    builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    });

    // Handle getProfile success (for session restoration)
    builder.addMatcher(
      authApi.endpoints.getProfile.matchFulfilled,
      (state, { payload }) => {
        state.user = {
          id: payload.user.id,
          name: payload.user.name,
          email: payload.user.email,
          role: payload.user.role,
        };
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.isLoading = false;
      }
    );

    // Handle getProfile pending
    builder.addMatcher(authApi.endpoints.getProfile.matchPending, (state) => {
      state.isLoading = true;
    });

    // Handle getProfile rejected (user not logged in)
    builder.addMatcher(authApi.endpoints.getProfile.matchRejected, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.isLoading = false;
    });
  },
});

export const { setUser, setLoading, setInitialized, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectIsAdmin = (state: { auth: AuthState }) => state.auth.user?.role === 'admin';
export const selectIsCitizen = (state: { auth: AuthState }) => state.auth.user?.role === 'citizen';

