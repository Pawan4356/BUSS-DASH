import { emptyWeeklySchedule } from '../../shared/components'

/** WorkingScheduleEntry[] (API) → TimeWindowPicker's { MON: { isOff, windows }, ... } shape. */
export function scheduleFromApi(rows) {
  const schedule = emptyWeeklySchedule()
  for (const row of rows) {
    if (row.isOff) {
      schedule[row.dayOfWeek] = { isOff: true, windows: [] }
    } else {
      schedule[row.dayOfWeek] = {
        isOff: false,
        windows: [...schedule[row.dayOfWeek].windows, { start: row.startTime, end: row.endTime }],
      }
    }
  }
  return schedule
}

/** TimeWindowPicker shape → the array the PATCH /staff/:id endpoint expects. */
export function scheduleToApi(schedule) {
  return Object.entries(schedule).map(([dayOfWeek, day]) => ({
    dayOfWeek,
    isOff: day.isOff,
    windows: day.windows,
  }))
}
