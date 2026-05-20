import { baseApi } from './baseApi';
import type {
  ConfirmSnapSOSRequest,
  ConfirmSnapSOSResponse,
  SnapSOSAnalyzeResponse,
} from '../../types';

export const snapSosApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    analyzeSnapSOS: builder.mutation<SnapSOSAnalyzeResponse, FormData>({
      query: (formData) => ({
        url: '/snap-sos/analyze',
        method: 'POST',
        body: formData,
      }),
    }),
    confirmSnapSOS: builder.mutation<ConfirmSnapSOSResponse, ConfirmSnapSOSRequest>({
      query: (payload) => ({
        url: '/snap-sos/confirm',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'SOS', id: 'LIST' }, 'Dashboard'],
    }),
  }),
});

export const {
  useAnalyzeSnapSOSMutation,
  useConfirmSnapSOSMutation,
} = snapSosApi;
