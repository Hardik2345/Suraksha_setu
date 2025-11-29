import { baseApi } from './baseApi';
import type {
  ResourceListParams,
  ResourceListResponse,
  ResourceDetailResponse,
  CreateResourceRequest,
  UpdateResourceRequest,
  SuccessResponse,
} from '../../types';

export const resourceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /api/resources
     * List resources; accepts optional lat,lng,radius for nearby search
     * Query params: type, search, lat, lng, radius
     */
    getResources: builder.query<ResourceListResponse, ResourceListParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.type) searchParams.append('type', params.type);
        if (params?.search) searchParams.append('search', params.search);
        if (params?.lat !== undefined) searchParams.append('lat', params.lat.toString());
        if (params?.lng !== undefined) searchParams.append('lng', params.lng.toString());
        if (params?.radius !== undefined) searchParams.append('radius', params.radius.toString());
        const queryString = searchParams.toString();
        return `/resources${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Resource' as const, id: _id })),
              { type: 'Resource', id: 'LIST' },
            ]
          : [{ type: 'Resource', id: 'LIST' }],
    }),

    /**
     * GET /api/resources/:id
     * Get resource by ID
     */
    getResourceById: builder.query<ResourceDetailResponse, string>({
      query: (id) => `/resources/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Resource', id }],
    }),

    /**
     * POST /api/resources
     * Create resource (admin only)
     */
    createResource: builder.mutation<SuccessResponse & { data: unknown }, CreateResourceRequest>({
      query: (resourceData) => ({
        url: '/resources',
        method: 'POST',
        body: resourceData,
      }),
      invalidatesTags: [{ type: 'Resource', id: 'LIST' }],
    }),

    /**
     * PUT /api/resources/:id
     * Update resource (admin only)
     */
    updateResource: builder.mutation<SuccessResponse, { id: string; data: UpdateResourceRequest }>({
      query: ({ id, data }) => ({
        url: `/resources/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Resource', id },
        { type: 'Resource', id: 'LIST' },
      ],
    }),

    /**
     * DELETE /api/resources/:id
     * Delete resource (soft delete, admin only)
     */
    deleteResource: builder.mutation<SuccessResponse, string>({
      query: (id) => ({
        url: `/resources/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Resource', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetResourcesQuery,
  useGetResourceByIdQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  useLazyGetResourcesQuery,
  useLazyGetResourceByIdQuery,
} = resourceApi;


