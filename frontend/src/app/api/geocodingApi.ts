import { baseApi } from './baseApi';
import type { ReverseGeocodeParams, ReverseGeocodeResponse } from '../../types';

export const geocodingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    reverseGeocode: builder.query<ReverseGeocodeResponse, ReverseGeocodeParams>({
      query: ({ lat, lng }) => ({
        url: `/geocode/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useLazyReverseGeocodeQuery } = geocodingApi;
