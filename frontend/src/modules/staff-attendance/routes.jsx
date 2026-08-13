import { Route } from 'react-router-dom'
import { AttendanceRegister } from './AttendanceRegister'
import { AttendanceHistory } from './AttendanceHistory'

export const staffAttendanceRoutes = (
  <>
    <Route index element={<AttendanceRegister />} />
    <Route path=":staffId/history" element={<AttendanceHistory />} />
  </>
)
