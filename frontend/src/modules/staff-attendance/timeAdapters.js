export function isoToTimeInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function timeInputToIso(dateStr, timeStr) {
  if (!timeStr) return null
  return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}
