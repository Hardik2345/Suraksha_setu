import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base API configuration with session-based auth (cookies)
// In development, use relative URL to leverage Vite's proxy
// In production, use the full API URL from environment variable
const getBaseUrl = () => {
  // If VITE_API_BASE_URL is explicitly set to a full URL, use it
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.startsWith('http')) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Otherwise use relative path (works with Vite proxy in dev)
  return '/api';
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    credentials: 'include', // Important: Include cookies for session-based auth
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['SOS', 'Resource', 'Alert', 'User', 'Dashboard'],
  endpoints: () => ({}),
});

