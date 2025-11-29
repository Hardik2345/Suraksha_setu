import { baseApi } from './baseApi';
import type {
  CreateSOSRequest,
  CreateSOSResponse,
  SOSListResponse,
  SOSDetailResponse,
  UpdateSOSStatusRequest,
  SOSListParams,
  SuccessResponse,
} from '../../types';

export const sosApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /api/sos
     * List SOS reports (own for citizen, all for admin)
     * Query params: status
     */
    getSOSList: builder.query<SOSListResponse, SOSListParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append('status', params.status);
        const queryString = searchParams.toString();
        return `/sos${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'SOS' as const, id: _id })),
              { type: 'SOS', id: 'LIST' },
            ]
          : [{ type: 'SOS', id: 'LIST' }],
    }),

    /**
     * POST /api/sos
     * Create SOS report
     */
    createSOS: builder.mutation<CreateSOSResponse, CreateSOSRequest>({
      query: (sosData) => ({
        url: '/sos',
        method: 'POST',
        body: sosData,
      }),
      invalidatesTags: [{ type: 'SOS', id: 'LIST' }, 'Dashboard'],
    }),

    /**
     * GET /api/sos/:id
     * Get SOS detail
     */
    getSOSById: builder.query<SOSDetailResponse, string>({
      query: (id) => `/sos/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'SOS', id }],
    }),

    /**
     * PUT /api/sos/:id
     * Admin update SOS status
     */
    updateSOSStatus: builder.mutation<SuccessResponse, { id: string; data: UpdateSOSStatusRequest }>({
      query: ({ id, data }) => ({
        url: `/sos/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'SOS', id },
        { type: 'SOS', id: 'LIST' },
        'Dashboard',
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSOSListQuery,
  useCreateSOSMutation,
  useGetSOSByIdQuery,
  useUpdateSOSStatusMutation,
  useLazyGetSOSListQuery,
  useLazyGetSOSByIdQuery,
} = sosApi;


