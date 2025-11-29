import { baseApi } from './baseApi';
import type {
  CitizenDashboardResponse,
  AdminDashboardResponse,
} from '../../types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /api/dashboard/stats
     * Get dashboard stats for user/admin (citizen dashboard)
     */
    getCitizenDashboard: builder.query<CitizenDashboardResponse, void>({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),

    /**
     * GET /api/admin/dashboard
     * Admin aggregates and pending SOS
     */
    getAdminDashboard: builder.query<AdminDashboardResponse, void>({
      query: () => '/admin/dashboard',
      providesTags: ['Dashboard'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCitizenDashboardQuery,
  useGetAdminDashboardQuery,
  useLazyGetCitizenDashboardQuery,
  useLazyGetAdminDashboardQuery,
} = dashboardApi;


