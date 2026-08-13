import { Route } from 'react-router-dom'
import { StaffDirectoryList } from './StaffDirectoryList'
import { StaffDirectoryDetail } from './StaffDirectoryDetail'

export const staffDirectoryRoutes = (
  <>
    <Route index element={<StaffDirectoryList />} />
    <Route path=":id" element={<StaffDirectoryDetail />} />
  </>
)
