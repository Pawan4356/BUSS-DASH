import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { loggedOut } from '../app/authSlice'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:4000',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

/** Wraps fetchBaseQuery to log the user out on a 401 from any endpoint. */
async function baseQueryWithReauth(args, api, extraOptions) {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error?.status === 401) {
    api.dispatch(loggedOut())
  }
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Business',
    'Staff',
    'Recruitment',
    'Candidate',
    'Attendance',
    'Workspace',
    'Resource',
    'Assignment',
  ],
  endpoints: () => ({}),
})
