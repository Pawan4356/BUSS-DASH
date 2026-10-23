/**
 * Hourly concurrent-assignment bar chart (premium summary, spec §9). A
 * single series — magnitude only, so bar height + a native title tooltip is
 * enough. Bars stay gray; only the peak hour is lifted out in ocean, the
 * same "look here" signal used for focus and upcoming items.
 */
export function WorkloadChart({ hours, peakHour }) {
  const max = Math.max(1, ...hours)
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 2,
          height: 80,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {hours.map((count, hour) => (
          <div
            key={hour}
            title={`${String(hour).padStart(2, '0')}:00 — ${count} concurrent assignment${count === 1 ? '' : 's'}`}
            style={{
              flex: 1,
              height: `${(count / max) * 100}%`,
              minHeight: count > 0 ? 3 : 1,
              background: hour === peakHour ? 'var(--ocean)' : 'var(--gray-400)',
              borderRadius: '2px 2px 0 0',
            }}
          />
        ))}
      </div>
      <div className="cluster" style={{ justifyContent: 'space-between', marginTop: 4 }}>
        <span className="text-muted" style={{ fontSize: 11 }}>
          00:00
        </span>
        <span className="text-muted" style={{ fontSize: 11 }}>
          12:00
        </span>
        <span className="text-muted" style={{ fontSize: 11 }}>
          23:00
        </span>
      </div>
      <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--ocean)', marginRight: 6 }} />
        Peak hour: {peakHour != null ? `${String(peakHour).padStart(2, '0')}:00` : 'No assignments today'}
      </p>
    </div>
  )
}
