import { NavLink, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { MODULES, resolveModuleAccess } from '../shared/flags'
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
        <div className="account-bar">
          <div className="account-email text-muted" title={account?.email}>
            {account?.email}
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
