import { DAY_OF_WEEK, DAY_OF_WEEK_SHORT } from '../../shared/ui-tags'
import { WEEK_DAYS, dayKey } from '../../shared/time'

/** M T W T F S S — filled on working days, today outlined. */
export function WeekStrip({ schedule = [] }) {
  const today = dayKey()
  return (
    <div className="week">
      {WEEK_DAYS.map((d) => {
        const windows = schedule.filter((w) => w.dayOfWeek === d && !w.isOff)
        const on = windows.length > 0
        const title = `${DAY_OF_WEEK[d]}: ${on ? windows.map((w) => `${w.start}–${w.end}`).join(', ') : 'off'}`
        return (
          <span key={d} className={`${on ? 'is-on' : ''} ${d === today ? 'is-today' : ''}`} title={title}>
            {DAY_OF_WEEK_SHORT[d][0]}
          </span>
        )
      })}
    </div>
  )
}
