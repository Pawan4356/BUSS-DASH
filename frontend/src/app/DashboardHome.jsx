import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MODULES, resolveModuleAccess } from '../shared/flags'

export function DashboardHome() {
  const flags = useSelector((s) => s.auth.flags)
  const business = useSelector((s) => s.auth.business)
  const modules = MODULES.map((m) => ({ ...m, access: resolveModuleAccess(m.key, { flags, business }) }))
  const available = modules.filter((m) => m.access.allowed)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">{business?.name}</p>
        </div>
      </div>

      {available.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-title">No modules active yet</div>
          <p>Purchase a module to see it appear here.</p>
        </div>
      ) : (
        <div className="summary-grid">
          {available.map((m) => (
            <Link key={m.key} to={m.path} className="card stat-tile" style={{ textDecoration: 'none' }}>
              <div className="stat-label" style={{ marginTop: 0 }}>
                {m.label}
              </div>
              <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                Open →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
