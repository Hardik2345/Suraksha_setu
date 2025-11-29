import { baseApi } from './baseApi';
import type {
  AlertListResponse,
  CreateAlertRequest,
  CreateAlertResponse,
  SuccessResponse,
} from '../../types';

export const alertApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /api/alerts
     * List alerts (location-based alerts near user if lat/lng available)
     */
    getAlerts: builder.query<AlertListResponse, void>({
      query: () => '/alerts',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Alert' as const, id: _id })),
              { type: 'Alert', id: 'LIST' },
            ]
          : [{ type: 'Alert', id: 'LIST' }],
    }),

    /**
     * POST /api/alerts
     * Create/broadcast an alert (admin only)
     */
    createAlert: builder.mutation<CreateAlertResponse, CreateAlertRequest>({
      query: (alertData) => ({
        url: '/alerts',
        method: 'POST',
        body: alertData,
      }),
      invalidatesTags: [{ type: 'Alert', id: 'LIST' }],
    }),

    /**
     * GET /api/alerts/history
     * Admin alert history
     */
    getAlertHistory: builder.query<AlertListResponse, void>({
      query: () => '/alerts/history',
      providesTags: [{ type: 'Alert', id: 'HISTORY' }],
    }),

    /**
     * PUT /api/alerts/:id/read
     * Mark alert as read
     */
    markAlertAsRead: builder.mutation<SuccessResponse, string>({
      query: (id) => ({
        url: `/alerts/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Alert', id }],
    }),

    /**
     * DELETE /api/alerts/:id
     * Deactivate alert (admin only)
     */
    deactivateAlert: builder.mutation<SuccessResponse, string>({
      query: (id) => ({
        url: `/alerts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Alert', id: 'LIST' }, { type: 'Alert', id: 'HISTORY' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAlertsQuery,
  useCreateAlertMutation,
  useGetAlertHistoryQuery,
  useMarkAlertAsReadMutation,
  useDeactivateAlertMutation,
  useLazyGetAlertsQuery,
  useLazyGetAlertHistoryQuery,
} = alertApi;


