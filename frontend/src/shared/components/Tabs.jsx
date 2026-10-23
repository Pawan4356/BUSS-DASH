import { useSlidingIndicator } from './useSlidingIndicator'

/**
 * Segmented filter/tab control. Replaces the old "row of buttons, active one
 * is btn-primary" pattern so switching views reads as one control, not as
 * several competing calls to action. Options: { value, label, count? }.
 */
export function Tabs({ options, value, onChange, ariaLabel }) {
  const ref = useSlidingIndicator("button[aria-pressed='true']")
  return (
    <div className="tabs" role="group" aria-label={ariaLabel} ref={ref}>
      <span className="slide-indicator" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
          {o.count != null && <em>{o.count}</em>}
        </button>
      ))}
    </div>
  )
}
