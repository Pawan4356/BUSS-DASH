import { dayKey, hhmmToHours, hoursToHhmm, isoToHours } from '../../shared/time'

/** Today's working windows for a staff list item, earliest first. */
export function todaysWindows(staff, key = dayKey()) {
  return (staff.weekSchedule ?? [])
    .filter((w) => w.dayOfWeek === key && !w.isOff)
    .sort((a, b) => a.start.localeCompare(b.start))
}

/**
 * Where a staff member stands right now, combining their schedule with the
 * attendance register row (when the attendance module is on).
 *   kind: live | done | scheduled | missing | leave | off | inactive
 */
export function todayState(staff, registerRow, now, hasRegister) {
  if (staff.archived) return { kind: 'inactive', label: '—' }
  if (staff.status === 'SUSPENDED' || staff.status === 'RESIGNED' || staff.status === 'PENDING') {
    return { kind: 'inactive', label: '—' }
  }
  if (staff.status === 'ON_LEAVE' || registerRow?.status === 'LEAVE') return { kind: 'leave', label: 'On leave' }

  const windows = todaysWindows(staff)
  if (windows.length === 0) return { kind: 'off', label: 'Day off' }

  const start = hhmmToHours(windows[0].start)
  const end = hhmmToHours(windows[windows.length - 1].end)
  const span = { start, end }

  if (registerRow?.checkIn) {
    const inH = isoToHours(registerRow.checkIn)
    if (registerRow.checkOut) {
      const outH = isoToHours(registerRow.checkOut)
      return { kind: 'done', label: `${hoursToHhmm(inH)} – ${hoursToHhmm(outH)}`, span, inH, outH, late: registerRow.lateCheckIn }
    }
    return { kind: 'live', label: `In at ${hoursToHhmm(inH)}`, span, inH, late: registerRow.lateCheckIn }
  }
  if (hasRegister && now > start + 0.25 && now < end) return { kind: 'missing', label: 'Not checked in', span }
  if (hasRegister && now >= end) return { kind: 'missing', label: 'Absent', span }
  return { kind: 'scheduled', label: `Starts ${windows[0].start}`, span }
}
