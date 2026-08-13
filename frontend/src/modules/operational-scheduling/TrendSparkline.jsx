/**
 * Monthly usage trend (spec §9). Three series (staff/workspace/resource
 * hours) over a month is awkward to read as overlapping lines in a strict
 * grayscale palette, so each gets its own labeled sparkline row instead of
 * color-coding a shared axis.
 */
export function TrendSparkline({ label, points, valueKey }) {
  const values = points.map((p) => p[valueKey])
  const max = Math.max(1, ...values)
  const total = values.reduce((sum, v) => sum + v, 0)

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="field-label">{label}</span>
        <span className="text-muted" style={{ fontSize: 12 }}>
          {total.toFixed(1)}h this month
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 32 }}>
        {points.map((p) => (
          <div
            key={p.date}
            title={`${p.date}: ${p[valueKey].toFixed(1)}h`}
            style={{
              flex: 1,
              height: `${(p[valueKey] / max) * 100}%`,
              minHeight: p[valueKey] > 0 ? 2 : 1,
              background: 'var(--text)',
              opacity: 0.55,
            }}
          />
        ))}
      </div>
    </div>
  )
}
