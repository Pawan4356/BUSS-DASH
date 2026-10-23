import { Navigate, Routes, Route, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { RequireAuth } from './app/RequireAuth'
import { RequireModule } from './app/RequireModule'
import { Layout } from './app/Layout'
import { LoginPage } from './app/LoginPage'
import { ProfilePage } from './app/ProfilePage'
import { selectIsAuthenticated, sessionEstablished } from './app/authSlice'
import { useGetMeQuery } from './api/authApi'
import { FLAGS } from './shared/flags'
import { NotFound } from './shared/components'
import { staffDirectoryRoutes } from './modules/staff-directory/routes'
import { resourceDirectoryRoutes } from './modules/resource-directory/routes'
import { staffAttendanceRoutes } from './modules/staff-attendance/routes'
import { staffRecruitmentRoutes } from './modules/staff-recruitment/routes'
import { operationalSchedulingRoutes } from './modules/operational-scheduling/routes'

/** Re-hydrates business/flags from the stored token on a full page reload. */
function SessionBootstrap({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const dispatch = useDispatch()
  const { data, isSuccess } = useGetMeQuery(undefined, { skip: !isAuthenticated })

  useEffect(() => {
    if (isSuccess && data) dispatch(sessionEstablished(data))
  }, [isSuccess, data, dispatch])

  return children
}

export default function App() {
  return (
    <SessionBootstrap>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/staff-directory" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route
            path="staff-directory/*"
            element={
              <RequireModule flagKey={FLAGS.STAFF_DIRECTORY}>
                <Outlet />
              </RequireModule>
            }
          >
            {staffDirectoryRoutes}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route
            path="resource-directory/*"
            element={
              <RequireModule flagKey={FLAGS.RESOURCE_DIRECTORY}>
                <Outlet />
              </RequireModule>
            }
          >
            {resourceDirectoryRoutes}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route
            path="staff-attendance/*"
            element={
              <RequireModule flagKey={FLAGS.STAFF_ATTENDANCE}>
                <Outlet />
              </RequireModule>
            }
          >
            {staffAttendanceRoutes}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route
            path="staff-recruitment/*"
            element={
              <RequireModule flagKey={FLAGS.STAFF_RECRUITMENT}>
                <Outlet />
              </RequireModule>
            }
          >
            {staffRecruitmentRoutes}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route
            path="operational-scheduling/*"
            element={
              <RequireModule flagKey={FLAGS.OPERATIONAL_SCHEDULING}>
                <Outlet />
              </RequireModule>
            }
          >
            {operationalSchedulingRoutes}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </SessionBootstrap>
  )
}
