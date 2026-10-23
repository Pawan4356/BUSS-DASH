/**
 * Read-only stat tile row — every module's "Summary" section is this shape.
 * A stat may carry `tone` (positive | warning | danger | info) to match the
 * StatusBadge color of the thing it counts; untoned stats stay grayscale.
 */
export function SummaryStats({ stats, loading }) {
  return (
    <div className="summary-grid">
      {stats.map((stat) => (
        <div className="card stat-tile" key={stat.label} data-tone={stat.tone}>
          {loading ? (
            <div className="skeleton-line" style={{ width: '60%', height: 24, marginBottom: 8 }} />
          ) : (
            <div className="stat-value">{stat.value}</div>
          )}
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
