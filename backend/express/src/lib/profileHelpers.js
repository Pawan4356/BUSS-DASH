// Account profile — the small set of general details every dashboard user
// has regardless of the business they belong to.

/** Must stay in sync with AVATAR_PRESETS in frontend/src/shared/components/Avatar.jsx. */
export const AVATAR_PRESET_KEYS = [
  'person-ocean',
  'person-sage',
  'person-coral',
  'person-sun',
  'person-plum',
  'person-slate',
  'person-teal',
  'person-rose',
  'person-amber',
  'person-indigo',
  'person-forest',
  'person-berry',
  'person-saffron',
  'gorilla',
  'attack-helicopter',
]

export const PROFILE_FIELDS = ['firstName', 'lastName', 'jobTitle', 'department', 'phone', 'location', 'timezone']

const MAX_FIELD_LENGTH = 120
// ~375 KB of base64 — the client resizes uploads to 256x256 JPEG, which lands
// well under this; the cap only guards against unresized payloads.
const MAX_AVATAR_LENGTH = 500_000
const DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/

export function serializeProfile(account) {
  return {
    firstName: account.firstName ?? null,
    lastName: account.lastName ?? null,
    displayName: [account.firstName, account.lastName].filter(Boolean).join(' ') || null,
    jobTitle: account.jobTitle ?? null,
    department: account.department ?? null,
    phone: account.phone ?? null,
    location: account.location ?? null,
    timezone: account.timezone ?? null,
    avatar: account.avatar ?? null,
    memberSince: account.createdAt ?? null,
  }
}

export function isValidAvatar(value) {
  if (value === null) return true
  if (typeof value !== 'string') return false
  if (value.startsWith('preset:')) return AVATAR_PRESET_KEYS.includes(value.slice('preset:'.length))
  return value.length <= MAX_AVATAR_LENGTH && DATA_URL_PATTERN.test(value)
}

/**
 * Picks whitelisted profile fields out of a request body. Empty strings
 * become null so a cleared input actually clears the column. Returns
 * { data } or { error } — never both.
 */
export function pickProfileUpdate(body) {
  const data = {}
  for (const key of PROFILE_FIELDS) {
    if (!(key in body)) continue
    const value = body[key]
    if (value !== null && typeof value !== 'string') return { error: `${key} must be a string` }
    const trimmed = value?.trim() || null
    if (trimmed && trimmed.length > MAX_FIELD_LENGTH) return { error: `${key} is too long` }
    data[key] = trimmed
  }
  if ('avatar' in body) {
    if (!isValidAvatar(body.avatar)) return { error: 'Avatar must be a built-in preset or a PNG/JPEG/WebP image under 375 KB' }
    data.avatar = body.avatar
  }
  return { data }
}
