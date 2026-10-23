import { NavLink, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { FLAGS, MODULES, resolveModuleAccess } from '../shared/flags'
import { loggedOut } from './authSlice'

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem('theme')
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function ThemeIcon({ theme }) {
  return theme === 'dark' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  )
}

const MODULE_ICONS = {
  [FLAGS.STAFF_DIRECTORY]: (
    <>
      <path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" />
      <circle cx="12" cy="8" r="4" />
    </>
  ),
  [FLAGS.STAFF_RECRUITMENT]: (
    <>
      <path d="M15 19c0-2.2-2.7-4-6-4s-6 1.8-6 4" />
      <circle cx="9" cy="8" r="3.5" />
      <path d="M19 8v6M16 11h6" />
    </>
  ),
  [FLAGS.STAFF_ATTENDANCE]: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4" />
    </>
  ),
  [FLAGS.RESOURCE_DIRECTORY]: (
    <>
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  [FLAGS.OPERATIONAL_SCHEDULING]: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </>
  ),
}

function ModuleIcon({ moduleKey }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {MODULE_ICONS[moduleKey]}
    </svg>
  )
}

function formatRole(role) {
  return role ? role.charAt(0) + role.slice(1).toLowerCase() : null
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
      <path d="m14 8 4 4-4 4M9 12h9" />
    </svg>
  )
}

export function Layout() {
  const dispatch = useDispatch()
  const flags = useSelector((s) => s.auth.flags)
  const business = useSelector((s) => s.auth.business)
  const account = useSelector((s) => s.auth.account)
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand" aria-label="PARSOR">
          <img className="brand-logo" src="/LOGO.png" alt="" />
          <img className="brand-name" src="/PARSOR.png" alt="PARSOR" />
        </div>
        {business?.name && (
          <div className="sidebar-business">
            <strong>{business.name}</strong>
          </div>
        )}
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
                    <ModuleIcon moduleKey={module.key} />
                    {module.label}
                  </NavLink>
                ) : (
                  <span className="nav-link is-locked" title="Not available on your current plan">
                    <ModuleIcon moduleKey={module.key} />
                    {module.label}
                    <span className="nav-lock">Locked</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        <div style={{ flex: 1 }} />
        <div className="account-bar">
          <div className="account-email" title={account?.email}>
            {account?.email}
            {account?.role && <span>{formatRole(account.role)}</span>}
          </div>
          <div className="account-actions">
            <button
              type="button"
              className="btn btn-icon"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              <ThemeIcon theme={theme} />
            </button>
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => dispatch(loggedOut())}
              aria-label="Log out"
              title="Log out"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
