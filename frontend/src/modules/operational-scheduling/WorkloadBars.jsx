const STANDARD_DAY_HOURS = 8

/**
 * Assigned hours per person against a standard day. The grey tick marks the
 * standard day; bars past it turn coral (overtime).
 */
export function WorkloadBars({ staff }) {
  const rows = [...staff].sort((a, b) => b.assignedHours - a.assignedHours)
  if (rows.length === 0) return <p className="none">No active staff.</p>
  const max = Math.max(STANDARD_DAY_HOURS, ...rows.map((r) => r.assignedHours))

  return (
    <div className="bars">
      {rows.map((r) => {
        const over = r.assignedHours > STANDARD_DAY_HOURS
        return (
          <div className="wl" key={r.staffId}>
            <span className="wl-name" title={r.name}>
              {r.name ?? 'Unnamed'}
            </span>
            <div className={`wl-track${over ? ' is-over' : ''}`}>
              <i style={{ width: `${(r.assignedHours / max) * 100}%` }} />
              <u style={{ left: `${(STANDARD_DAY_HOURS / max) * 100}%` }} title={`${STANDARD_DAY_HOURS}h standard day`} />
            </div>
            <span className="wl-value">
              {r.assignedHours}/{STANDARD_DAY_HOURS}h
            </span>
          </div>
        )
      })}
      <div className="none" style={{ fontSize: 12 }}>
        The grey tick marks an {STANDARD_DAY_HOURS}-hour day. Coral bars are overtime.
      </div>
    </div>
  )
}
