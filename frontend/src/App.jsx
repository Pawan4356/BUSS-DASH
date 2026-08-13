import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { RequireAuth } from './app/RequireAuth'
import { RequireModule } from './app/RequireModule'
import { Layout } from './app/Layout'
import { LoginPage } from './app/LoginPage'
import { DashboardHome } from './app/DashboardHome'
import { selectIsAuthenticated, sessionEstablished } from './app/authSlice'
import { useGetMeQuery } from './api/authApi'
import { FLAGS } from './shared/flags'
import { staffDirectoryRoutes } from './modules/staff-directory/routes'

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
          <Route index element={<DashboardHome />} />
          <Route
            path="staff-directory/*"
            element={
              <RequireModule flagKey={FLAGS.STAFF_DIRECTORY}>
                <Outlet />
              </RequireModule>
            }
          >
            {staffDirectoryRoutes}
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionBootstrap>
  )
}
