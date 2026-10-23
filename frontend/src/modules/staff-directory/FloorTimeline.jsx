import { initials } from '../../shared/components'
import { DAY_OF_WEEK } from '../../shared/ui-tags'
import { dayKey, hoursToHhmm } from '../../shared/time'
import { todayState } from './todayState'

/**
 * "Today on the floor": one track per person working today, scheduled shift
 * as a hatched bar, actual check-in as a solid bar, plus a now-line. Falls
 * back to schedule-only when the attendance module isn't active.
 */
export function FloorTimeline({ staff, registerByStaff, hasRegister, now }) {
  const rows = staff
    .map((s) => ({ s, st: todayState(s, registerByStaff.get(s.id), now, hasRegister) }))
    .filter(({ st }) => st.span || st.kind === 'leave')

  if (rows.length === 0) return null

  const spans = rows.filter((r) => r.st.span).map((r) => r.st.span)
  let h0 = Math.min(7, ...spans.map((x) => Math.floor(x.start)))
  let h1 = Math.max(21, ...spans.map((x) => Math.ceil(x.end)))
  h0 = Math.max(0, h0)
  h1 = Math.min(24, h1)
  const range = h1 - h0
  const pct = (h) => ((Math.min(Math.max(h, h0), h1) - h0) / range) * 100

  const onShift = rows.filter((r) => r.st.kind === 'live').length
  const late = rows.filter((r) => r.st.late).length
  const missing = rows.filter((r) => r.st.kind === 'missing').length
  const showNow = now >= h0 && now <= h1

  const hourMarks = []
  for (let h = h0; h <= h1; h += 2) {
    if (!showNow || Math.abs(h - now) > 0.9) hourMarks.push(h)
  }

  return (
    <section className="card floor" aria-label="Today on the floor">
      <div className="floor-top">
        <h2 className="section-title">{DAY_OF_WEEK[dayKey()]} on the floor</h2>
        <div className="tally">
          {hasRegister ? (
            <>
              <span>
                <b>{onShift}</b>on shift now
              </span>
              <span>
                <b>{late}</b>late
              </span>
              <span>
                <b>{missing}</b>not checked in
              </span>
            </>
          ) : (
            <span>
              <b>{rows.length}</b>scheduled today
            </span>
          )}
        </div>
        <div className="legend">
          {hasRegister && (
            <span>
              <i style={{ background: 'var(--ocean)' }} />
              Checked in
            </span>
          )}
          <span>
            <i
              style={{
                background: 'repeating-linear-gradient(135deg, var(--ocean-tint) 0 3px, transparent 3px 6px)',
                border: '1px solid var(--ocean)',
              }}
            />
            Scheduled
          </span>
          {hasRegister && (
            <>
              <span>
                <i style={{ background: 'var(--sun)', width: 4 }} />
                Late
              </span>
              <span>
                <i style={{ background: 'var(--coral-tint)', border: '1px solid var(--coral)' }} />
                Missing
              </span>
            </>
          )}
        </div>
      </div>

      <div className="tl" style={{ '--tl-step': `${100 / range}%` }}>
        <div />
        <div className="tl-hours">
          {hourMarks.map((h) => (
            <span key={h} style={{ left: `${pct(h)}%`, transform: h === h0 ? 'none' : h === h1 ? 'translateX(-100%)' : undefined }}>
              {hoursToHhmm(h)}
            </span>
          ))}
        </div>

        {rows.map(({ s, st }) => (
          <TimelineRow key={s.id} staff={s} st={st} pct={pct} now={now} />
        ))}

        {showNow && (
          <div className="tl-overlay">
            <div className="tl-now" style={{ left: `${pct(now)}%` }}>
              <span>{hoursToHhmm(now)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function TimelineRow({ staff, st, pct, now }) {
  const first = staff.name?.split(' ')[0] ?? 'Pending'
  const span = st.span ?? { start: 9, end: 17 }
  const box = (from, to) => ({ left: `${pct(from)}%`, width: `${Math.max(pct(to) - pct(from), 1)}%` })

  let bars
  if (st.kind === 'live') {
    bars = (
      <>
        <div className="tl-bar is-scheduled" style={box(span.start, span.end)} />
        <div className="tl-bar is-live" style={box(st.inH, Math.max(now, st.inH + 0.25))}>
          {st.label}
        </div>
        {st.late && <div className="tl-tick" title="Late check-in" style={{ left: `${pct(st.inH)}%` }} />}
      </>
    )
  } else if (st.kind === 'done') {
    bars = (
      <>
        <div className="tl-bar is-done" style={box(st.inH, st.outH)}>
          {st.label}
        </div>
        {st.late && <div className="tl-tick" title="Late check-in" style={{ left: `${pct(st.inH)}%` }} />}
      </>
    )
  } else {
    const cls = { missing: 'is-missing', leave: 'is-leave' }[st.kind] ?? 'is-scheduled'
    bars = (
      <div className={`tl-bar ${cls}`} style={box(span.start, span.end)}>
        {st.label}
      </div>
    )
  }

  return (
    <>
      <div className="tl-name">
        <span className="avatar" aria-hidden="true">
          {initials(staff.name)}
        </span>
        {first} <small>{staff.title}</small>
      </div>
      <div className="tl-track">{bars}</div>
    </>
  )
}
