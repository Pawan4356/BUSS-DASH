/**
 * PARSOR logo: a lowercase "p" whose counter is a brass doorway, then "ars",
 * a clock for the "o", and "r".
 *
 * The p and the clock are drawn to DM Sans Bold proportions (x-height, stem
 * weight, descender), so they sit in the word like real letters. Colours follow
 * currentColor; the brass accent comes from --logo-accent.
 *
 * Usage in Layout.jsx:
 *   import { ParsorLogo } from '../shared/components'
 *   <div className="brand"><ParsorLogo size={28} /></div>
 *
 * ParsorMark on its own is the icon (favicon, app icon, collapsed sidebar).
 */

const P_PATH = 'M6 -48H30A22 22 0 0 1 52 -26V-2A2 2 0 0 1 50 0H17V20A2 2 0 0 1 15 22H6A2 2 0 0 1 4 20V-46A2 2 0 0 1 6 -48ZM17 -11V-24A11 11 0 0 1 39 -24V-11Z'
const DOOR_PATH = 'M17 -11V-24A11 11 0 0 1 39 -24V-11Z'
const ACCENT = { fill: 'var(--logo-accent, #C9973A)' }

/** The door "p" on its own, centred in a square. */
export function ParsorMark({ size = 32, title }) {
  return (
    <svg
      className="parsor-mark"
      width={size}
      height={size}
      viewBox="-12 -53 80 80"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path fill="currentColor" fillRule="evenodd" d={P_PATH} />
      <path style={ACCENT} d={DOOR_PATH} />
    </svg>
  )
}

/** Full wordmark. `size` is the font size in px. */
export function ParsorLogo({ size = 28 }) {
  return (
    <span
      className="parsor-logo"
      style={{ '--logo-size': `${size}px` }}
      role="img"
      aria-label="PARSOR"
    >
      <svg className="parsor-p" viewBox="0 -50 56 74" aria-hidden="true">
        <path fill="currentColor" fillRule="evenodd" d={P_PATH} />
        <path style={ACCENT} d={DOOR_PATH} />
      </svg>
      <span aria-hidden="true">ars</span>
      <svg className="parsor-clock" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="6.5" />
        <path d="M16 16V11.2" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path
          d="M16 16l3.4 2.2"
          style={{ stroke: 'var(--logo-accent, #C9973A)' }}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
      <span aria-hidden="true">r</span>
    </span>
  )
}

export default ParsorLogo
