import { baseApi } from './baseApi';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ProfileResponse,
  SuccessResponse,
} from '../../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /api/auth/login
     * Login using username/email and password (session cookie returned)
     */
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    /**
     * POST /api/auth/register
     * Register a new user
     */
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    /**
     * POST /api/auth/logout
     * Logout and clear session
     */
    logout: builder.mutation<SuccessResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'SOS', 'Resource', 'Alert', 'Dashboard'],
    }),

    /**
     * GET /api/auth/profile
     * Get current authenticated user (requires session cookie)
     */
    getProfile: builder.query<ProfileResponse, void>({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
} = authApi;

