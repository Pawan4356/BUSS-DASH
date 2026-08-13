import { baseApi } from '../../api/baseApi'

export const resourceDirectoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getResourceDirectorySummary: builder.query({
      query: () => '/resource-directory/summary',
      providesTags: ['Workspace', 'Resource'],
    }),
    listWorkspaces: builder.query({
      query: () => '/resource-directory/workspaces',
      providesTags: ['Workspace'],
    }),
    getWorkspace: builder.query({
      query: (id) => `/resource-directory/workspaces/${id}`,
      providesTags: (result, error, id) => [{ type: 'Workspace', id }],
    }),
    createWorkspace: builder.mutation({
      query: (body) => ({ url: '/resource-directory/workspaces', method: 'POST', body }),
      invalidatesTags: ['Workspace'],
    }),
    updateWorkspace: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/resource-directory/workspaces/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => ['Workspace', { type: 'Workspace', id }],
    }),
    deleteWorkspace: builder.mutation({
      query: (id) => ({ url: `/resource-directory/workspaces/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Workspace'],
    }),
    listResources: builder.query({
      query: (params) => ({ url: '/resource-directory/resources', params }),
      providesTags: ['Resource'],
    }),
    getResource: builder.query({
      query: (id) => `/resource-directory/resources/${id}`,
      providesTags: (result, error, id) => [{ type: 'Resource', id }],
    }),
    createResource: builder.mutation({
      query: (body) => ({ url: '/resource-directory/resources', method: 'POST', body }),
      invalidatesTags: ['Resource'],
    }),
    updateResource: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/resource-directory/resources/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => ['Resource', { type: 'Resource', id }],
    }),
    deleteResource: builder.mutation({
      query: (id) => ({ url: `/resource-directory/resources/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Resource'],
    }),
  }),
})

export const {
  useGetResourceDirectorySummaryQuery,
  useListWorkspacesQuery,
  useGetWorkspaceQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useListResourcesQuery,
  useGetResourceQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
} = resourceDirectoryApi
