import { Route } from 'react-router-dom'
import { ResourceDirectoryHome } from './ResourceDirectoryHome'
import { WorkspaceDetail } from './WorkspaceDetail'
import { ResourceDetail } from './ResourceDetail'

export const resourceDirectoryRoutes = (
  <>
    <Route index element={<ResourceDirectoryHome />} />
    <Route path="workspaces/:id" element={<WorkspaceDetail />} />
    <Route path="resources/:id" element={<ResourceDetail />} />
  </>
)
