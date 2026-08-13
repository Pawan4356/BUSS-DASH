import { DAY_OF_WEEK_SHORT } from '../ui-tags'

const DAYS = Object.keys(DAY_OF_WEEK_SHORT)

/**
 * Weekly time-window picker (spec §4) — used by Staff Directory working
 * schedule and Operational Scheduling assignments.
 *
 * value: { MON: { isOff: bool, windows: [{ start, end }] }, ... }
 */
export function TimeWindowPicker({ value, onChange }) {
  function updateDay(day, patch) {
    onChange({ ...value, [day]: { ...value[day], ...patch } })
  }

  function addWindow(day) {
    const windows = value[day]?.windows ?? []
    updateDay(day, { windows: [...windows, { start: '09:00', end: '17:00' }] })
  }

  function removeWindow(day, index) {
    const windows = value[day]?.windows ?? []
    updateDay(day, { windows: windows.filter((_, i) => i !== index) })
  }

  function updateWindow(day, index, field, val) {
    const windows = (value[day]?.windows ?? []).map((w, i) => (i === index ? { ...w, [field]: val } : w))
    updateDay(day, { windows })
  }

  return (
    <div className="schedule-grid">
      {DAYS.map((day) => {
        const dayValue = value[day] ?? { isOff: false, windows: [] }
        return (
          <div className="schedule-day-row" key={day}>
            <div className="schedule-day-label">{DAY_OF_WEEK_SHORT[day]}</div>
            <div className="schedule-windows">
              {!dayValue.isOff &&
                dayValue.windows.map((w, index) => (
                  <div className="schedule-window-row" key={index}>
                    <input
                      type="time"
                      className="input"
                      value={w.start}
                      onChange={(e) => updateWindow(day, index, 'start', e.target.value)}
                      aria-label={`${DAY_OF_WEEK_SHORT[day]} window ${index + 1} start`}
                    />
                    <span className="text-muted">to</span>
                    <input
                      type="time"
                      className="input"
                      value={w.end}
                      onChange={(e) => updateWindow(day, index, 'end', e.target.value)}
                      aria-label={`${DAY_OF_WEEK_SHORT[day]} window ${index + 1} end`}
                    />
                    <button
                      type="button"
                      className="btn btn-icon"
                      aria-label={`Remove window ${index + 1} on ${DAY_OF_WEEK_SHORT[day]}`}
                      onClick={() => removeWindow(day, index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              {!dayValue.isOff && (
                <button type="button" className="btn btn-sm" onClick={() => addWindow(day)}>
                  + Add Time Window
                </button>
              )}
              {dayValue.isOff && <span className="text-muted">Off</span>}
            </div>
            <label className="schedule-off-toggle">
              <input
                type="checkbox"
                checked={dayValue.isOff}
                onChange={(e) => updateDay(day, { isOff: e.target.checked })}
              />
              Off
            </label>
          </div>
        )
      })}
    </div>
  )
}

export function emptyWeeklySchedule() {
  return DAYS.reduce((acc, day) => ({ ...acc, [day]: { isOff: false, windows: [] } }), {})
}
