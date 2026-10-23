// Small clock/calendar helpers shared by the timeline, week strip and
// workload views. Times are local wall-clock hours as decimals (9.5 = 09:30).

export const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const JS_DAY_TO_KEY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function dayKey(date = new Date()) {
  return JS_DAY_TO_KEY[date.getDay()]
}

/** Same date string the attendance register uses for "today". */
export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function hhmmToHours(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return h + m / 60
}

export function isoToHours(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60
}

export function hoursToHhmm(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m === 60 ? 0 : m).padStart(2, '0')}`
}

export function nowHours() {
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}
