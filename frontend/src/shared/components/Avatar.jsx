import { initials } from './PersonCell'

// Built-in avatar options. Keys must stay in sync with AVATAR_PRESET_KEYS in
// backend/express/src/lib/profileHelpers.js — the API rejects unknown keys.
// Each preset carries its own colours, so it reads the same in light and dark.
// All drawn on a 40×40 canvas, cropped to a circle.

const INK = '#2b2622'

/** Hair drawn behind the head (long hair falls past the face). */
function BackHair({ style, color }) {
  if (style === 'long') return <path d="M11.6 17.5c0-6.4 3.7-10.9 8.4-10.9s8.4 4.5 8.4 10.9v10.8H11.6z" fill={color} />
  if (style === 'bun') return <circle cx="20" cy="7.2" r="3.7" fill={color} />
  return null
}

/** Hair drawn over the top of the head. */
function FrontHair({ style, color }) {
  switch (style) {
    case 'short':
    case 'long':
    case 'bun':
      return (
        <path
          d="M13.2 16.2c-.6-5.6 2.6-9.6 6.8-9.6s7.4 4 6.8 9.6c-1-2.9-3.6-4.7-6.8-4.9-3.2.2-5.8 2-6.8 4.9z"
          fill={color}
        />
      )
    case 'quiff':
      return <path d="M13.2 15.8c-.7-5.8 2.9-9.6 7.3-9.6 4.1 0 7 2.7 6.4 8-2.6-.4-6.3-1.9-8.4-4.3-1.1 2.7-2.9 4.8-5.3 5.9z" fill={color} />
    case 'curly':
      return (
        <g fill={color}>
          <circle cx="14.2" cy="12.6" r="3.2" />
          <circle cx="17" cy="9.2" r="3.4" />
          <circle cx="20.8" cy="8.2" r="3.5" />
          <circle cx="24.4" cy="9.6" r="3.3" />
          <circle cx="26.2" cy="13" r="2.9" />
          <circle cx="13.4" cy="15.6" r="2.2" />
          <circle cx="26.8" cy="16" r="2" />
        </g>
      )
    case 'bald':
      return (
        <g fill={color}>
          <path d="M13.4 17.6c-.1-1.4.1-2.6.5-3.6l1 .4c-.3 1-.4 2.1-.3 3.3z" />
          <path d="M26.6 17.6c.1-1.4-.1-2.6-.5-3.6l-1 .4c.3 1 .4 2.1.3 3.3z" />
        </g>
      )
    case 'turban':
      return (
        <g>
          <path d="M12.8 16.4c-.9-6.3 2.7-10.6 7.2-10.6s8.1 4.3 7.2 10.6c-1.8-1.9-4.4-2.9-7.2-2.9s-5.4 1-7.2 2.9z" fill={color} />
          <path d="M20 13.5c1.2-2.4 3.4-4.6 6.2-5.6" stroke="rgba(0,0,0,0.18)" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      )
    default:
      return null
  }
}

/**
 * Head-and-shoulders portrait. hair: short | long | bun | quiff | curly | bald |
 * turban | hijab (hairColor is the head-covering colour for the last two).
 * `beard` and `glasses` are optional; beardColor defaults to hairColor.
 */
function Person({ skin, hair = 'short', hairColor = INK, beardColor = hairColor, shirt, beard, glasses }) {
  const hijab = hair === 'hijab'
  return (
    <>
      <path d="M5.5 40c.9-8.6 6.6-13.2 14.5-13.2S33.6 31.4 34.5 40z" fill={shirt} />
      {hijab ? (
        <>
          <path
            d="M20 6.2c-5.4 0-9 4.5-9 10.2 0 3.7 1.5 6.9 3.8 9l-2.3 4.6h15l-2.3-4.6c2.3-2.1 3.8-5.3 3.8-9 0-5.7-3.6-10.2-9-10.2z"
            fill={hairColor}
          />
          <ellipse cx="20" cy="17" rx="5.2" ry="6.2" fill={skin} />
        </>
      ) : (
        <>
          <BackHair style={hair} color={hairColor} />
          <rect x="17.2" y="21" width="5.6" height="7" rx="2" fill={skin} />
          <ellipse cx="20" cy="16" rx="6.6" ry="7.3" fill={skin} />
          <FrontHair style={hair} color={hairColor} />
        </>
      )}
      {beard && (
        <path d="M13.6 17.6c.3 5 3 8.2 6.4 8.2s6.1-3.2 6.4-8.2c-1.6 1.9-3.8 2.8-6.4 2.8s-4.8-.9-6.4-2.8z" fill={beardColor} />
      )}
      <circle cx="17.6" cy="16.8" r="0.9" fill={INK} />
      <circle cx="22.4" cy="16.8" r="0.9" fill={INK} />
      {!beard && <path d="M18 20.4c1.2 1 2.8 1 4 0" stroke={INK} strokeWidth="0.9" fill="none" strokeLinecap="round" />}
      {glasses && (
        <g stroke={INK} strokeWidth="0.8" fill="rgba(255,255,255,0.25)">
          <circle cx="17.4" cy="16.8" r="2.3" />
          <circle cx="22.6" cy="16.8" r="2.3" />
          <path d="M19.7 16.6h.6" fill="none" />
        </g>
      )}
    </>
  )
}

function Gorilla() {
  const fur = '#3a3433'
  const face = '#74655c'
  const dark = '#241f1e'
  return (
    <>
      <path d="M1 40c1.2-9.4 7.6-14.4 19-14.4S37.8 30.6 39 40z" fill="#2c2827" />
      <circle cx="10.4" cy="18.6" r="2.3" fill={fur} />
      <circle cx="29.6" cy="18.6" r="2.3" fill={fur} />
      <path d="M9.4 19.5C9.4 11.6 14 6.6 20 6.6s10.6 5 10.6 12.9c0 3.4-1.2 5.9-3 7.6H12.4c-1.8-1.7-3-4.2-3-7.6z" fill={fur} />
      <ellipse cx="20" cy="17.8" rx="6.2" ry="3.4" fill={face} />
      <ellipse cx="20" cy="21.8" rx="6.6" ry="4.8" fill={face} />
      <path d="M12.8 15.6c2.1-2.2 4.7-2.7 7.2-1.6 2.5-1.1 5.1-.6 7.2 1.6v1.6H12.8z" fill={dark} />
      <circle cx="17.2" cy="17.6" r="0.95" fill="#0f0d0c" />
      <circle cx="22.8" cy="17.6" r="0.95" fill="#0f0d0c" />
      <ellipse cx="18.7" cy="20.6" rx="1" ry="0.65" fill={dark} />
      <ellipse cx="21.3" cy="20.6" rx="1" ry="0.65" fill={dark} />
      <path d="M17 24c2 1 4 1 6 0" stroke={dark} strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </>
  )
}

function AttackHelicopter() {
  const hull = '#4f5d38'
  const dark = '#2e3820'
  // Drawn small; scaled up around the centre to fill the circle.
  return (
    <g transform="translate(20 20) scale(1.12) translate(-20.5 -19.5)">
      {/* main rotor + mast */}
      <rect x="4" y="11.6" width="29" height="1.3" rx="0.65" fill={dark} />
      <rect x="18" y="12.6" width="2" height="4" fill={dark} />
      {/* fuselage + tail boom */}
      <path d="M5.4 21.6c0-3 3-5.2 7-5.2h9.2c2.8 0 4.8 1.4 5.5 3.3h6.1l2.3-3h1.4l-1 6.2h-1l-1.4-1.6h-7.4c-.8 1.6-2.6 2.6-5 2.6h-9c-4 0-6.7-.9-6.7-2.3z" fill={hull} />
      {/* tandem canopy */}
      <path d="M8.2 19.4c.5-1.8 2.2-2.9 4.4-2.9h1.6v2.9z" fill="#a8c6d8" />
      <path d="M15 16.5h3.8l1.2 2.9h-5z" fill="#a8c6d8" />
      {/* tail rotor */}
      <path d="M35.8 15v7.4" stroke={dark} strokeWidth="1.1" strokeLinecap="round" />
      {/* chin gun */}
      <circle cx="8.6" cy="23.6" r="1.2" fill={dark} />
      <path d="M8 24.1H3.6" stroke={dark} strokeWidth="0.9" strokeLinecap="round" />
      {/* stub wing + rocket pod */}
      <rect x="14" y="22.6" width="8" height="1.3" fill={dark} />
      <rect x="14.6" y="23.9" width="5.4" height="2.3" rx="1.15" fill="#3c4729" />
      {/* skids */}
      <path d="M12.4 24.6v3M21.6 24.6v3M9.6 27.6h15.2" stroke={dark} strokeWidth="0.9" strokeLinecap="round" fill="none" />
    </g>
  )
}

export const AVATAR_PRESETS = [
  { key: 'person-ocean', label: 'Short hair', bg: '#d6e9f8', draw: <Person skin="#eac0a0" hair="short" hairColor="#2b211c" shirt="#1f6fb2" /> },
  { key: 'person-sage', label: 'Long hair', bg: '#dcefe2', draw: <Person skin="#d6a07a" hair="long" hairColor="#3a2618" shirt="#2f7a4f" /> },
  { key: 'person-coral', label: 'Bun', bg: '#fbe0d9', draw: <Person skin="#f6d7c3" hair="bun" hairColor="#a8622c" shirt="#c4543b" /> },
  { key: 'person-sun', label: 'Curly hair', bg: '#fbefc9', draw: <Person skin="#8d5a3b" hair="curly" hairColor="#1c1a19" shirt="#b07d0c" /> },
  { key: 'person-plum', label: 'Side part, glasses', bg: '#ece0f5', draw: <Person skin="#b97a55" hair="quiff" hairColor="#2b211c" shirt="#7446a0" glasses /> },
  { key: 'person-slate', label: 'Bald, beard', bg: '#e3e7ec', draw: <Person skin="#5f3b27" hair="bald" hairColor="#1c1a19" shirt="#4a5868" beard /> },
  { key: 'person-teal', label: 'Hijab', bg: '#d5eeef', draw: <Person skin="#d6a07a" hair="hijab" hairColor="#13706f" shirt="#0f4f4e" /> },
  { key: 'person-rose', label: 'Long hair, glasses', bg: '#f8dde8', draw: <Person skin="#f6d7c3" hair="long" hairColor="#d9b45a" shirt="#b8457a" glasses /> },
  { key: 'person-amber', label: 'Grey hair, beard', bg: '#fde6cc', draw: <Person skin="#eac0a0" hair="short" hairColor="#a3a8ad" shirt="#a35a12" beard /> },
  { key: 'person-indigo', label: 'Curly hair, glasses', bg: '#dfe2f7', draw: <Person skin="#5f3b27" hair="curly" hairColor="#1c1a19" shirt="#3f4bb0" glasses /> },
  { key: 'person-forest', label: 'Side part, beard', bg: '#e4f1d8', draw: <Person skin="#f6d7c3" hair="quiff" hairColor="#5a3a22" shirt="#3d6b35" beard /> },
  { key: 'person-berry', label: 'Bun, glasses', bg: '#f3dbe2', draw: <Person skin="#8d5a3b" hair="bun" hairColor="#2b211c" shirt="#8e2f4f" glasses /> },
  { key: 'person-saffron', label: 'Turban, beard', bg: '#fde9d4', draw: <Person skin="#d6a07a" hair="turban" hairColor="#e07a1f" beardColor="#2b211c" shirt="#2c3e66" beard /> },
  { key: 'gorilla', label: 'Gorilla', bg: '#e6e0d6', draw: <Gorilla /> },
  { key: 'attack-helicopter', label: 'Attack helicopter', bg: '#dde7ef', draw: <AttackHelicopter /> },
]

const PRESETS_BY_KEY = Object.fromEntries(AVATAR_PRESETS.map((p) => [p.key, p]))

export function PresetGlyph({ preset }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" fill={preset.bg} />
      {preset.draw}
    </svg>
  )
}

/**
 * Account avatar: a built-in preset ("preset:<key>"), an uploaded photo
 * (data:image URL), or initials when neither is set. A preset key that no
 * longer exists also falls back to initials.
 */
export function Avatar({ avatar, name, size = 34, className = '' }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) }
  const classes = `avatar${className ? ` ${className}` : ''}`

  if (avatar?.startsWith('preset:')) {
    const preset = PRESETS_BY_KEY[avatar.slice('preset:'.length)]
    if (preset) {
      return (
        <span className={`${classes} avatar-media`} style={style} aria-hidden="true">
          <PresetGlyph preset={preset} />
        </span>
      )
    }
  }

  if (avatar?.startsWith('data:image/')) {
    return (
      <span className={`${classes} avatar-media`} style={style} aria-hidden="true">
        <img src={avatar} alt="" />
      </span>
    )
  }

  return (
    <span className={classes} style={style} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
