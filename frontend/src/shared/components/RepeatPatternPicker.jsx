import { REPEAT_PATTERN } from '../ui-tags'

/**
 * Repeat pattern (spec §4): Do not repeat / Repeat weekly / Custom (interval
 * stepper + start/end date).
 *
 * value: { pattern: 'NONE'|'WEEKLY'|'CUSTOM', interval, startDate, endDate }
 */
export function RepeatPatternPicker({ value, onChange }) {
  function set(patch) {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="repeat-options">
      {Object.entries(REPEAT_PATTERN).map(([key, label]) => (
        <label className="radio-row" key={key}>
          <input
            type="radio"
            name="repeat-pattern"
            checked={value.pattern === key}
            onChange={() => set({ pattern: key })}
          />
          {label}
        </label>
      ))}

      {value.pattern === 'CUSTOM' && (
        <div className="field-grid" style={{ marginLeft: 24 }}>
          <div className="field">
            <span className="field-label">Repeat every (weeks)</span>
            <div className="stepper">
              <button
                type="button"
                onClick={() => set({ interval: Math.max(1, (value.interval ?? 1) - 1) })}
                aria-label="Decrease interval"
              >
                −
              </button>
              <span>{value.interval ?? 1}</span>
              <button
                type="button"
                onClick={() => set({ interval: (value.interval ?? 1) + 1 })}
                aria-label="Increase interval"
              >
                +
              </button>
            </div>
          </div>
          <div className="field">
            <span className="field-label">Start date</span>
            <input
              type="date"
              className="input"
              value={value.startDate ?? ''}
              onChange={(e) => set({ startDate: e.target.value })}
            />
          </div>
          <div className="field">
            <span className="field-label">End date</span>
            <input
              type="date"
              className="input"
              value={value.endDate ?? ''}
              onChange={(e) => set({ endDate: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
