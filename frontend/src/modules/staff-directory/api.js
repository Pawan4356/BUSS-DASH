import { baseApi } from '../../api/baseApi'

export const staffDirectoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffSummary: builder.query({
      query: () => '/staff-directory/summary',
      providesTags: ['Staff'],
    }),
    listStaff: builder.query({
      query: (params) => ({ url: '/staff-directory/staff', params }),
      providesTags: ['Staff'],
    }),
    getStaff: builder.query({
      query: (id) => `/staff-directory/staff/${id}`,
      providesTags: (result, error, id) => [{ type: 'Staff', id }],
    }),
    inviteStaff: builder.mutation({
      query: (body) => ({ url: '/staff-directory/staff', method: 'POST', body }),
      invalidatesTags: ['Staff'],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/staff-directory/staff/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => ['Staff', { type: 'Staff', id }],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({ url: `/staff-directory/staff/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Staff'],
    }),
  }),
})

export const {
  useGetStaffSummaryQuery,
  useListStaffQuery,
  useGetStaffQuery,
  useInviteStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} = staffDirectoryApi
