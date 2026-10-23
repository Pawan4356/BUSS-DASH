/**
 * WHITE-BOX TESTS — src/lib/profileHelpers.js
 * Technique: branch coverage of serializeProfile (?? null defaults, displayName
 *            join), isValidAvatar (null / non-string / preset / data URL / size),
 *            pickProfileUpdate (key-absent skip, type check, trim, length, avatar).
 * Also checks the backend preset list matches the frontend AVATAR_PRESETS.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  AVATAR_PRESET_KEYS,
  PROFILE_FIELDS,
  serializeProfile,
  isValidAvatar,
  pickProfileUpdate,
} from '../../../backend/express/src/lib/profileHelpers.js'

describe('WB-PROFILE  serializeProfile', () => {
  it('undefined columns -> null (every ?? null branch)', () => {
    expect(serializeProfile({})).toEqual({
      firstName: null, lastName: null, displayName: null, jobTitle: null, department: null,
      phone: null, location: null, timezone: null, avatar: null, memberSince: null,
    })
  })
  it.each([
    ['first + last', { firstName: 'A', lastName: 'B' }, 'A B'],
    ['first only', { firstName: 'A' }, 'A'],
    ['last only', { lastName: 'B' }, 'B'],
    ['empty strings -> null', { firstName: '', lastName: '' }, null],
  ])('displayName: %s', (_l, names, expected) => {
    expect(serializeProfile(names).displayName).toBe(expected)
  })
  it('only whitelisted keys are returned (no passwordHash / email / businessId)', () => {
    const out = serializeProfile({ passwordHash: 'h', email: 'e', businessId: 'b', role: 'OWNER' })
    expect(Object.keys(out).sort()).toEqual(
      [...PROFILE_FIELDS, 'avatar', 'displayName', 'memberSince'].sort(),
    )
  })
})

describe('WB-PROFILE  isValidAvatar — one case per branch', () => {
  it('null -> true', () => expect(isValidAvatar(null)).toBe(true))
  it('undefined / number -> false (non-string branch)', () => {
    expect(isValidAvatar(undefined)).toBe(false)
    expect(isValidAvatar(1)).toBe(false)
  })
  it('preset: prefix -> true only for known keys', () => {
    expect(isValidAvatar('preset:person-ocean')).toBe(true)
    expect(isValidAvatar('preset:')).toBe(false)
    expect(isValidAvatar('preset:nope')).toBe(false)
  })
  it('data URL -> pattern AND length must both hold (&& short-circuit)', () => {
    expect(isValidAvatar('data:image/png;base64,AAAA')).toBe(true)
    expect(isValidAvatar('data:image/png;base64,' + 'A'.repeat(500_000))).toBe(false) // length fails first
    expect(isValidAvatar('data:image/bmp;base64,AAAA')).toBe(false) // pattern fails
  })
})

describe('WB-PROFILE  pickProfileUpdate', () => {
  it('keys absent from the body are skipped (`continue` branch) -> empty data', () => {
    expect(pickProfileUpdate({})).toEqual({ data: {} })
  })
  it('null is allowed and stored as null', () => {
    expect(pickProfileUpdate({ phone: null })).toEqual({ data: { phone: null } })
  })
  it('non-null non-string -> error, returns before later keys', () => {
    expect(pickProfileUpdate({ firstName: 5, lastName: 'ok' })).toEqual({ error: 'firstName must be a string' })
  })
  it('trims, and whitespace-only becomes null (`|| null` branch)', () => {
    expect(pickProfileUpdate({ firstName: '  A ', lastName: '  ' })).toEqual({ data: { firstName: 'A', lastName: null } })
  })
  it('length is checked AFTER trimming (120 chars + padding is fine)', () => {
    expect(pickProfileUpdate({ jobTitle: `  ${'x'.repeat(120)}  ` }).data.jobTitle).toHaveLength(120)
    expect(pickProfileUpdate({ jobTitle: 'x'.repeat(121) })).toEqual({ error: 'jobTitle is too long' })
  })
  it('avatar is validated separately and never trimmed', () => {
    expect(pickProfileUpdate({ avatar: 'preset:gorilla' })).toEqual({ data: { avatar: 'preset:gorilla' } })
    expect(pickProfileUpdate({ avatar: 'bad' }).error).toMatch(/^Avatar must be/)
  })
  it('never returns both data and error', () => {
    for (const body of [{}, { firstName: 1 }, { avatar: 'bad' }, { firstName: 'A', avatar: null }]) {
      const out = pickProfileUpdate(body)
      expect('data' in out && 'error' in out).toBe(false)
    }
  })
  it('ignores keys outside PROFILE_FIELDS + avatar', () => {
    expect(pickProfileUpdate({ email: 'x', role: 'STAFF', passwordHash: 'h' })).toEqual({ data: {} })
  })
})

describe('WB-PROFILE  frontend / backend parity', () => {
  it('AVATAR_PRESET_KEYS lists exactly the keys of AVATAR_PRESETS in frontend Avatar.jsx', () => {
    const src = readFileSync(
      fileURLToPath(new URL('../../../frontend/src/shared/components/Avatar.jsx', import.meta.url)),
      'utf8',
    )
    const block = src.slice(src.indexOf('export const AVATAR_PRESETS'))
    const frontendKeys = [...block.matchAll(/key:\s*'([^']+)'/g)].map((m) => m[1])
    expect(frontendKeys.sort()).toEqual([...AVATAR_PRESET_KEYS].sort())
  })
})
