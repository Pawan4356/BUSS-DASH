const POSITIVE = new Set(['ACTIVE', 'PRESENT', 'HIRED', 'AVAILABLE', 'COMPLETED', 'SCHEDULED'])
const NEGATIVE = new Set(['SUSPENDED', 'REJECTED', 'CANCELLED', 'ABSENT', 'NOT_AVAILABLE'])

/** Grayscale status dot + label. Tone is derived from the raw enum key. */
export function StatusBadge({ value, label }) {
  const tone = POSITIVE.has(value) ? 'badge-positive' : NEGATIVE.has(value) ? 'badge-danger' : 'badge-muted'
  return <span className={`badge ${tone}`}>{label}</span>
}
