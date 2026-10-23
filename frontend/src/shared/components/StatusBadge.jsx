// Enum key → signal tone (see the color legend at the top of theme.css).
// Anything unlisted (Inactive, Closed, Resigned, Off) stays grayscale.
const TONES = {
  positive: ['ACTIVE', 'PRESENT', 'HIRED', 'AVAILABLE', 'COMPLETED'],
  warning: ['PENDING', 'ON_LEAVE', 'LEAVE', 'MAINTENANCE'],
  danger: ['SUSPENDED', 'REJECTED', 'CANCELLED', 'ABSENT', 'NOT_AVAILABLE'],
  info: ['SCHEDULED', 'UPCOMING', 'APPLIED', 'SHORTLISTED'],
}
const TONE_BY_VALUE = Object.fromEntries(
  Object.entries(TONES).flatMap(([tone, values]) => values.map((v) => [v, tone])),
)

/** Status dot + label. Tone is derived from the raw enum key. */
export function StatusBadge({ value, label }) {
  const tone = TONE_BY_VALUE[value] ?? 'muted'
  return <span className={`badge badge-${tone}`}>{label}</span>
}
