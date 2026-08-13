/**
 * Hourly concurrent-assignment bar chart (premium summary, spec §9). A
 * single grayscale series — magnitude only, so bar height + a native title
 * tooltip is enough; the peak hour gets an outline instead of a second color.
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
              background: 'var(--text)',
              opacity: hour === peakHour ? 1 : 0.45,
              outline: hour === peakHour ? '2px solid var(--text)' : 'none',
              outlineOffset: 1,
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
        Peak hour: {peakHour != null ? `${String(peakHour).padStart(2, '0')}:00` : 'No assignments today'}
      </p>
    </div>
  )
}
