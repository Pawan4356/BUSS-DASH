import { NavLink, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { MODULES, resolveModuleAccess } from '../shared/flags'
import { loggedOut } from './authSlice'

export function Layout() {
  const dispatch = useDispatch()
  const flags = useSelector((s) => s.auth.flags)
  const business = useSelector((s) => s.auth.business)
  const account = useSelector((s) => s.auth.account)

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">{business?.name ?? 'BUSS-DASH'}</div>
        <ul className="nav-list">
          {MODULES.map((module) => {
            const access = resolveModuleAccess(module.key, { flags, business })
            return (
              <li key={module.key}>
                {access.allowed ? (
                  <NavLink
                    to={module.path}
                    className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                  >
                    {module.label}
                  </NavLink>
                ) : (
                  <span className="nav-link is-locked" title="Not available on your current plan">
                    {module.label}
                    <span className="nav-lock">🔒</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        <div style={{ flex: 1 }} />
        <div className="stack">
          <div className="text-muted" style={{ fontSize: 12 }}>
            {account?.email}
          </div>
          <button type="button" className="btn btn-sm" onClick={() => dispatch(loggedOut())}>
            Log out
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
