import { baseApi } from './baseApi'
import { profileUpdated } from '../app/authSlice'

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({ url: '/profile', method: 'PATCH', body }),
      invalidatesTags: ['Profile'],
      // Keeps the sidebar avatar/name in sync without waiting on /auth/me.
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(profileUpdated(data))
        } catch {
          // surfaced by the caller
        }
      },
    }),
    changePassword: builder.mutation({
      query: (body) => ({ url: '/profile/password', method: 'POST', body }),
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } = profileApi
