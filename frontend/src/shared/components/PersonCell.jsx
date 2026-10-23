export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/**
 * Initials avatar + name + optional secondary line — the first column of
 * every people table. Pass `onOpen` to make the name a link-style button.
 */
export function PersonCell({ name, subtitle, onOpen, fallback = 'Awaiting details' }) {
  const label = name ?? <span className="text-muted">{fallback}</span>
  return (
    <div className="person">
      <span className="avatar" aria-hidden="true">
        {initials(name)}
      </span>
      <div className="person-text">
        {onOpen ? (
          <button type="button" className="row-link" onClick={onOpen}>
            {label}
          </button>
        ) : (
          <b>{label}</b>
        )}
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  )
}
