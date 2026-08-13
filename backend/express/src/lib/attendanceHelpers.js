const DAY_INDEX_TO_ENUM = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function dayOfWeekForDate(date) {
  return DAY_INDEX_TO_ENUM[date.getDay()]
}

export function startOfDay(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function stayTimeMinutes(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null
  return Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 60000))
}

/** Late/early are relative to the day's first working window, if any. */
export function computeLateEarly({ checkIn, checkOut, dayWindows }) {
  const firstWindow = dayWindows[0]
  if (!firstWindow) return { lateCheckIn: false, earlyCheckOut: false }

  const lateCheckIn = checkIn ? formatTime(checkIn) > firstWindow.startTime : false
  const earlyCheckOut = checkOut ? formatTime(checkOut) < firstWindow.endTime : false
  return { lateCheckIn, earlyCheckOut }
}

function formatTime(date) {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
