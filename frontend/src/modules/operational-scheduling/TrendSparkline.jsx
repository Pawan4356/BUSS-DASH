/**
 * Monthly usage trend (spec §9). Three series (staff/workspace/resource
 * hours) read poorly as overlapping lines, so each gets its own labeled
 * sparkline row. `color` identifies the series; the label carries a matching
 * swatch so the hue is never the only cue.
 */
export function TrendSparkline({ label, points, valueKey, color = 'var(--text)' }) {
  const values = points.map((p) => p[valueKey])
  const max = Math.max(1, ...values)
  const total = values.reduce((sum, v) => sum + v, 0)

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="field-label">
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: color, marginRight: 6 }} />
          {label}
        </span>
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
              background: color,
              borderRadius: '1px 1px 0 0',
            }}
          />
        ))}
      </div>
    </div>
  )
}
