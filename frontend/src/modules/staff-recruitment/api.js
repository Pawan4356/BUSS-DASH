import { baseApi } from '../../api/baseApi'

export const staffRecruitmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecruitmentSummary: builder.query({
      query: () => '/staff-recruitment/summary',
      providesTags: ['Recruitment'],
    }),
    listRecruitments: builder.query({
      query: (params) => ({ url: '/staff-recruitment/recruitments', params }),
      providesTags: ['Recruitment'],
    }),
    getRecruitment: builder.query({
      query: (id) => `/staff-recruitment/recruitments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Recruitment', id }],
    }),
    createRecruitment: builder.mutation({
      query: (body) => ({ url: '/staff-recruitment/recruitments', method: 'POST', body }),
      invalidatesTags: ['Recruitment'],
    }),
    updateRecruitment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/staff-recruitment/recruitments/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => ['Recruitment', { type: 'Recruitment', id }],
    }),
    duplicateRecruitment: builder.mutation({
      query: (id) => ({ url: `/staff-recruitment/recruitments/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['Recruitment'],
    }),
    closeRecruitment: builder.mutation({
      query: (id) => ({ url: `/staff-recruitment/recruitments/${id}/close`, method: 'POST' }),
      invalidatesTags: ['Recruitment'],
    }),
    launchRecruitment: builder.mutation({
      query: (id) => ({ url: `/staff-recruitment/recruitments/${id}/launch`, method: 'POST' }),
      invalidatesTags: ['Recruitment'],
    }),
    listCandidates: builder.query({
      query: ({ recruitmentId, source }) => ({
        url: `/staff-recruitment/recruitments/${recruitmentId}/candidates`,
        params: { source },
      }),
      providesTags: ['Candidate'],
    }),
    addCandidate: builder.mutation({
      query: ({ recruitmentId, ...body }) => ({
        url: `/staff-recruitment/recruitments/${recruitmentId}/candidates`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Candidate', 'Recruitment'],
    }),
    getCandidate: builder.query({
      query: (id) => `/staff-recruitment/candidates/${id}`,
      providesTags: (result, error, id) => [{ type: 'Candidate', id }],
    }),
    updateCandidate: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/staff-recruitment/candidates/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => ['Candidate', { type: 'Candidate', id }, 'Recruitment'],
    }),
    hireCandidate: builder.mutation({
      query: (id) => ({ url: `/staff-recruitment/candidates/${id}/hire`, method: 'POST' }),
      invalidatesTags: ['Candidate', 'Recruitment', 'Staff'],
    }),
  }),
})

export const {
  useGetRecruitmentSummaryQuery,
  useListRecruitmentsQuery,
  useGetRecruitmentQuery,
  useCreateRecruitmentMutation,
  useUpdateRecruitmentMutation,
  useDuplicateRecruitmentMutation,
  useCloseRecruitmentMutation,
  useLaunchRecruitmentMutation,
  useListCandidatesQuery,
  useAddCandidateMutation,
  useGetCandidateQuery,
  useUpdateCandidateMutation,
  useHireCandidateMutation,
} = staffRecruitmentApi
