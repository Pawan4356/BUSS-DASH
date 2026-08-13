import { schedulingApi } from '../../api/schedulingBaseApi'

export const operationalSchedulingApi = schedulingApi.injectEndpoints({
  endpoints: (builder) => ({
    getSchedulingSummary: builder.query({
      query: (date) => ({ url: '/scheduling/summary', params: { date_str: date } }),
      providesTags: ['Assignment'],
    }),
    getSchedulingTrend: builder.query({
      query: (month) => ({ url: '/scheduling/summary/trend', params: { month } }),
    }),
    getSchedulingList: builder.query({
      query: (date) => ({ url: '/scheduling/list', params: { date_str: date } }),
      providesTags: ['Assignment'],
    }),
    createAssignment: builder.mutation({
      query: (body) => ({ url: '/scheduling/assignments', method: 'POST', body }),
      invalidatesTags: ['Assignment'],
    }),
    cancelAssignment: builder.mutation({
      query: (id) => ({ url: `/scheduling/assignments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Assignment'],
    }),
  }),
})

export const {
  useGetSchedulingSummaryQuery,
  useGetSchedulingTrendQuery,
  useGetSchedulingListQuery,
  useCreateAssignmentMutation,
  useCancelAssignmentMutation,
} = operationalSchedulingApi
