import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Operational Scheduling talks to the FastAPI service directly (see
// docs/decisions.md #2) — separate base URL, same bearer token as the
// Express-backed baseApi.
export const schedulingApi = createApi({
  reducerPath: 'schedulingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Assignment'],
  endpoints: () => ({}),
})
