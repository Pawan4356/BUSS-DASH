import { baseApi } from '../../api/baseApi'

export const staffAttendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceSummary: builder.query({
      query: () => '/staff-attendance/summary',
      providesTags: ['Attendance'],
    }),
    getAttendanceRegister: builder.query({
      query: (params) => ({ url: '/staff-attendance/register', params }),
      providesTags: ['Attendance'],
    }),
    updateAttendance: builder.mutation({
      query: ({ staffId, date, ...body }) => ({
        url: `/staff-attendance/register/${staffId}`,
        method: 'PATCH',
        params: { date },
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),
    getAttendanceHistory: builder.query({
      query: ({ staffId, month }) => ({ url: `/staff-attendance/staff/${staffId}/history`, params: { month } }),
    }),
  }),
})

export const {
  useGetAttendanceSummaryQuery,
  useGetAttendanceRegisterQuery,
  useUpdateAttendanceMutation,
  useGetAttendanceHistoryQuery,
} = staffAttendanceApi
