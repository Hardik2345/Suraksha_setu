import { baseApi } from './baseApi';
import type { OutbreakMapParams, OutbreakMapResponse } from '../../types';

export const outbreakMapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOutbreakMap: builder.query<OutbreakMapResponse, OutbreakMapParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.type && params.type !== 'all') searchParams.append('type', params.type);
        if (params?.severity) searchParams.append('severity', params.severity);
        if (params?.source) searchParams.append('source', params.source);
        if (params?.status) searchParams.append('status', params.status);
        if (params?.from) searchParams.append('from', params.from);
        if (params?.to) searchParams.append('to', params.to);
        if (params?.bounds) searchParams.append('bounds', params.bounds);
        if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());

        const queryString = searchParams.toString();
        return `/admin/outbreak-map${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: [{ type: 'SOS', id: 'OUTBREAK_MAP' }],
    }),
  }),
});

export const { useGetOutbreakMapQuery, useLazyGetOutbreakMapQuery } = outbreakMapApi;
