import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/*
 * Themed replacement for <input type="date"> / <input type="month">. The
 * native popup can't be styled, so this draws its own calendar in a popover.
 * Values stay in the same string formats the native inputs used
 * ("YYYY-MM-DD", or "YYYY-MM" in month mode), so callers and the API don't
 * change. Weeks start on Monday, matching the rest of the app.
 *
 * Three views, drilled through from the header: days → months → years.
 * Clicking the header title zooms out a level; picking a year or month
 * zooms back in, so jumping to e.g. a 1990 date of birth is three clicks.
 */

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const POPOVER_HEIGHT = 340
const YEARS_PER_PAGE = 12

const pad = (n) => String(n).padStart(2, '0')
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toMonthIso = (y, m) => `${y}-${pad(m + 1)}`

function parseIso(value) {
  if (!value) return null
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m) return null
  return new Date(y, m - 1, d || 1)
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function addDays(d, n) {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function addMonths(d, n) {
  const next = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(d.getDate(), lastDay))
  return next
}

/** 6×7 grid of dates covering the month of `cursor`, Monday first. */
function monthGrid(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = addDays(first, -offset)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

function formatValue(value, mode) {
  const d = parseIso(value)
  if (!d) return null
  return mode === 'month'
    ? d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </svg>
  )
}

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === 'left' ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'} />
    </svg>
  )
}

export function DatePicker({
  value,
  onChange,
  mode = 'date',
  min,
  max,
  enabledMonths,
  clearable = false,
  placeholder,
  disabled = false,
  ariaLabel,
  style,
}) {
  const isMonth = mode === 'month'
  const baseView = isMonth ? 'months' : 'days'

  const [open, setOpen] = useState(false)
  const [view, setView] = useState(baseView)
  const [cursor, setCursor] = useState(() => parseIso(value) ?? new Date())
  const [position, setPosition] = useState(null)
  const fieldRef = useRef(null)
  const popRef = useRef(null)
  const gridRef = useRef(null)

  const selected = parseIso(value)
  const minDate = parseIso(min)
  const maxDate = parseIso(max)
  const today = new Date()

  const outOfRange = (d) => (minDate && d < minDate && !sameDay(d, minDate)) || (maxDate && d > maxDate && !sameDay(d, maxDate))
  // A month/year is only unpickable when the whole span falls outside min/max.
  const spanOutOfRange = (start, end) => (minDate && end < minDate) || (maxDate && start > maxDate)
  // `enabledMonths` ("YYYY-MM" list) narrows month mode further, e.g. to months that have data.
  const enabledSet = enabledMonths ? new Set(enabledMonths) : null
  const monthOutOfRange = (y, m) =>
    spanOutOfRange(new Date(y, m, 1), new Date(y, m + 1, 0)) || Boolean(enabledSet && !enabledSet.has(toMonthIso(y, m)))
  const yearOutOfRange = (y) =>
    spanOutOfRange(new Date(y, 0, 1), new Date(y, 11, 31)) ||
    Boolean(enabledSet && !Array.from({ length: 12 }, (_, m) => toMonthIso(y, m)).some((k) => enabledSet.has(k)))

  function openPicker() {
    if (disabled) return
    setCursor(selected ?? new Date())
    setView(baseView)
    setOpen(true)
  }

  function close({ refocus = true } = {}) {
    setOpen(false)
    if (refocus) fieldRef.current?.focus()
  }

  function pick(next) {
    onChange(next)
    close()
  }

  /** Cursor moved to month `m` of year `y`, keeping its day where that month allows. */
  const cursorAt = (y, m) => new Date(y, m, Math.min(cursor.getDate(), new Date(y, m + 1, 0).getDate()))

  function chooseYear(y) {
    setCursor(cursorAt(y, cursor.getMonth()))
    setView('months')
  }

  function chooseMonth(y, m) {
    if (isMonth) pick(toMonthIso(y, m))
    else {
      setCursor(cursorAt(y, m))
      setView('days')
    }
  }

  // Position the popover against the viewport (fixed) so it is never clipped
  // by a scrolling modal or table wrapper; flip above when there's no room.
  useLayoutEffect(() => {
    if (!open || !fieldRef.current) return
    const rect = fieldRef.current.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom
    const top = below < POPOVER_HEIGHT + 12 && rect.top > below ? rect.top - POPOVER_HEIGHT - 6 : rect.bottom + 6
    const left = Math.min(rect.left, window.innerWidth - 300)
    setPosition({ top: Math.max(8, top), left: Math.max(8, left) })
  }, [open])

  // The grid only exists once the popover has been positioned; refocus it
  // whenever the view changes so arrow keys keep working after a drill.
  useEffect(() => {
    if (open && position) gridRef.current?.focus()
  }, [open, position, view])

  useEffect(() => {
    if (!open) return undefined

    function onPointer(e) {
      if (!popRef.current?.contains(e.target) && !fieldRef.current?.contains(e.target)) close({ refocus: false })
    }
    function onScroll(e) {
      if (!popRef.current?.contains(e.target)) close({ refocus: false })
    }
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  const yearPageStart = Math.floor(cursor.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE

  // Arrow/Page key steps per view. Days: day/week, PageUp/Down = month.
  // Months: month/row, Page = year. Years: year/row, Page = one page.
  const KEY_STEPS = {
    days: { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [0, -7], ArrowDown: [0, 7], PageUp: [-1, 0], PageDown: [1, 0] },
    months: { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [-3, 0], ArrowDown: [3, 0], PageUp: [-12, 0], PageDown: [12, 0] },
    years: { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [-36, 0], ArrowDown: [36, 0], PageUp: [-144, 0], PageDown: [144, 0] },
  }

  function onGridKey(e) {
    const step = KEY_STEPS[view][e.key]
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (step) {
      e.preventDefault()
      const [months, days] = step
      setCursor((c) => (days ? addDays(c, days) : addMonths(c, months)))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const y = cursor.getFullYear()
      if (view === 'years') !yearOutOfRange(y) && chooseYear(y)
      else if (view === 'months') !monthOutOfRange(y, cursor.getMonth()) && chooseMonth(y, cursor.getMonth())
      else if (!outOfRange(cursor)) pick(toIso(cursor))
    }
  }

  function shift(dir) {
    if (view === 'days') setCursor((c) => addMonths(c, dir))
    else if (view === 'months') setCursor((c) => addMonths(c, dir * 12))
    else setCursor((c) => addMonths(c, dir * 12 * YEARS_PER_PAGE))
  }

  const label = formatValue(value, mode)
  const heading =
    view === 'days'
      ? cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : view === 'months'
        ? String(cursor.getFullYear())
        : `${yearPageStart} – ${yearPageStart + YEARS_PER_PAGE - 1}`
  const zoomOut = view === 'days' ? 'months' : view === 'months' ? 'years' : null
  const navNoun = { days: 'month', months: 'year', years: `${YEARS_PER_PAGE} years` }[view]

  return (
    <>
      <button
        type="button"
        ref={fieldRef}
        className={`input datepicker-field${open ? ' is-open' : ''}`}
        style={style}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel ? `${ariaLabel}: ${label ?? 'not set'}` : undefined}
        onClick={() => (open ? close() : openPicker())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            openPicker()
          }
        }}
      >
        <span className={label ? undefined : 'datepicker-placeholder'}>
          {label ?? placeholder ?? (isMonth ? 'Pick a month' : 'Pick a date')}
        </span>
        <CalendarIcon />
      </button>

      {open && position && (
        <div
          ref={popRef}
          className="datepicker-pop"
          role="dialog"
          aria-label={isMonth ? 'Choose month' : 'Choose date'}
          style={{ top: position.top, left: position.left }}
        >
          <div className="dp-head">
            <button type="button" className="dp-nav" aria-label={`Previous ${navNoun}`} onClick={() => shift(-1)}>
              <Chevron dir="left" />
            </button>
            {zoomOut ? (
              <button
                type="button"
                className="dp-title dp-title-btn"
                aria-live="polite"
                aria-label={`${heading}, choose ${zoomOut === 'months' ? 'month and year' : 'year'}`}
                onClick={() => setView(zoomOut)}
              >
                {heading}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </button>
            ) : (
              <span className="dp-title" aria-live="polite">
                {heading}
              </span>
            )}
            <button type="button" className="dp-nav" aria-label={`Next ${navNoun}`} onClick={() => shift(1)}>
              <Chevron dir="right" />
            </button>
          </div>

          {view === 'years' && (
            <div className="dp-grid dp-months" role="grid" aria-label="Years" tabIndex={0} ref={gridRef} onKeyDown={onGridKey}>
              {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i).map((y) => (
                <button
                  key={y}
                  type="button"
                  tabIndex={-1}
                  disabled={yearOutOfRange(y)}
                  className={[
                    'dp-cell',
                    selected?.getFullYear() === y && 'is-selected',
                    today.getFullYear() === y && 'is-today',
                    cursor.getFullYear() === y && 'is-cursor',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={selected?.getFullYear() === y}
                  onClick={() => chooseYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {view === 'months' && (
            <div className="dp-grid dp-months" role="grid" aria-label="Months" tabIndex={0} ref={gridRef} onKeyDown={onGridKey}>
              {MONTHS_SHORT.map((name, m) => {
                const y = cursor.getFullYear()
                const isSel = selected && selected.getFullYear() === y && selected.getMonth() === m
                const isNow = today.getFullYear() === y && today.getMonth() === m
                return (
                  <button
                    key={name}
                    type="button"
                    tabIndex={-1}
                    disabled={monthOutOfRange(y, m)}
                    className={`dp-cell${isSel ? ' is-selected' : ''}${isNow ? ' is-today' : ''}${cursor.getMonth() === m ? ' is-cursor' : ''}`}
                    aria-pressed={Boolean(isSel)}
                    onClick={() => chooseMonth(y, m)}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          )}

          {view === 'days' && (
            <>
              <div className="dp-weekdays" aria-hidden="true">
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="dp-grid dp-days" role="grid" aria-label="Days" tabIndex={0} ref={gridRef} onKeyDown={onGridKey}>
                {monthGrid(cursor).map((d) => {
                  const outside = d.getMonth() !== cursor.getMonth()
                  const blocked = outOfRange(d)
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      tabIndex={-1}
                      disabled={blocked}
                      className={[
                        'dp-cell',
                        outside && 'is-outside',
                        sameDay(d, today) && 'is-today',
                        sameDay(d, selected) && 'is-selected',
                        sameDay(d, cursor) && 'is-cursor',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={Boolean(sameDay(d, selected))}
                      aria-label={d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      onClick={() => pick(toIso(d))}
                    >
                      {d.getDate()}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="dp-foot">
            {clearable && value ? (
              <button type="button" className="dp-link" onClick={() => pick('')}>
                Clear
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="dp-link is-accent"
              disabled={isMonth ? monthOutOfRange(today.getFullYear(), today.getMonth()) : outOfRange(today)}
              onClick={() => pick(isMonth ? toMonthIso(today.getFullYear(), today.getMonth()) : toIso(today))}
            >
              {isMonth ? 'This month' : 'Today'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
