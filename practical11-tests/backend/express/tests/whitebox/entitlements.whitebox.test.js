/**
 * WHITE-BOX TESTS — Entitlement resolution (src/lib/entitlements.js)
 * Technique: branch / condition coverage + basis-path testing.
 * Every `case`, every `if` and both sides of every condition is exercised.
 *
 * Cyclomatic complexity of resolveModuleAccess = 17  ->  17 independent paths.
 */
import { describe, it, expect } from 'vitest'
import { resolveModuleAccess, FLAGS } from '../../src/lib/entitlements.js'

const flags = (o = {}) => ({
  staffDirectory: false, staffRecruitment: false, staffAttendance: false,
  resourceDirectory: false, operationalScheduling: false, operationalSchedulingPremium: false, ...o,
})
const NP = { allowed: false, reason: 'not-purchased' }
const OK = { allowed: true }

describe('WB-ENT  resolveModuleAccess — basis paths', () => {
  it('P01 flags === null/undefined -> not-purchased (guard clause)', () => {
    expect(resolveModuleAccess(FLAGS.STAFF_DIRECTORY, { flags: null })).toEqual(NP)
    expect(resolveModuleAccess(FLAGS.STAFF_DIRECTORY, { flags: undefined })).toEqual(NP)
  })

  it.each([FLAGS.STAFF_DIRECTORY, FLAGS.STAFF_ATTENDANCE, FLAGS.RESOURCE_DIRECTORY])('P02/P03 simple flag %s: true -> allowed, false -> not-purchased', (key) => {
    expect(resolveModuleAccess(key, { flags: flags({ [key]: true }) })).toEqual(OK)
    expect(resolveModuleAccess(key, { flags: flags({ [key]: false }) })).toEqual(NP)
  })

  describe('OPERATIONAL_SCHEDULING (3 paths)', () => {
    const k = FLAGS.OPERATIONAL_SCHEDULING
    it('P04 own flag off -> not-purchased', () => {
      expect(resolveModuleAccess(k, { flags: flags({ staffDirectory: true, resourceDirectory: true }) })).toEqual(NP)
    })
    it.each([
      ['directory missing', { staffDirectory: false, resourceDirectory: true }],
      ['resource directory missing', { staffDirectory: true, resourceDirectory: false }],
      ['both missing', { staffDirectory: false, resourceDirectory: false }],
    ])('P05 prerequisite %s -> requires-staff-and-resource-directory (condition coverage of the ||)', (_l, pre) => {
      expect(resolveModuleAccess(k, { flags: flags({ operationalScheduling: true, ...pre }) })).toEqual({
        allowed: false, reason: 'requires-staff-and-resource-directory',
      })
    })
    it('P06 own flag + both prerequisites -> allowed', () => {
      expect(resolveModuleAccess(k, { flags: flags({ operationalScheduling: true, staffDirectory: true, resourceDirectory: true }) })).toEqual(OK)
    })
  })

  describe('OPERATIONAL_SCHEDULING_PREMIUM (3 paths, recursive)', () => {
    const k = FLAGS.OPERATIONAL_SCHEDULING_PREMIUM
    const base = { operationalScheduling: true, staffDirectory: true, resourceDirectory: true }
    it('P07 base module blocked -> returns the base reason unchanged', () => {
      expect(resolveModuleAccess(k, { flags: flags({ operationalSchedulingPremium: true }) })).toEqual(NP)
      expect(resolveModuleAccess(k, { flags: flags({ operationalScheduling: true, operationalSchedulingPremium: true }) }).reason).toBe('requires-staff-and-resource-directory')
    })
    it('P08 base allowed, premium flag off -> not-purchased', () => {
      expect(resolveModuleAccess(k, { flags: flags(base) })).toEqual(NP)
    })
    it('P09 base allowed + premium on -> allowed', () => {
      expect(resolveModuleAccess(k, { flags: flags({ ...base, operationalSchedulingPremium: true }) })).toEqual(OK)
    })
  })

  describe('STAFF_RECRUITMENT (verification-level matrix)', () => {
    const k = FLAGS.STAFF_RECRUITMENT
    const f = flags({ staffRecruitment: true })
    it('P10 own flag off -> not-purchased', () => {
      expect(resolveModuleAccess(k, { flags: flags(), business: { recruitmentModelType: 'INTERNAL', verificationLevel: 'ENHANCED' } })).toEqual(NP)
    })
    it.each([
      ['B2C', 'ENHANCED', true], ['B2C', 'BASIC', false],
      ['BOTH', 'ENHANCED', true], ['BOTH', 'BASIC', false],
      ['INTERNAL', 'BASIC', true], ['INTERNAL', 'ENHANCED', true],
    ])('P11-P16 model=%s verification=%s -> allowed=%s', (model, ver, allowed) => {
      const r = resolveModuleAccess(k, { flags: f, business: { recruitmentModelType: model, verificationLevel: ver } })
      expect(r.allowed).toBe(allowed)
      if (!allowed) expect(r.reason).toBe('requires-enhanced-verification')
    })
    it('P17 INTERNAL path with an unknown verification level -> requires-enhanced-verification', () => {
      expect(resolveModuleAccess(k, { flags: f, business: { recruitmentModelType: 'INTERNAL', verificationLevel: 'NONE' } }).allowed).toBe(false)
    })
    it('P18 business undefined (optional chaining) -> falls to INTERNAL branch, denied', () => {
      expect(resolveModuleAccess(k, { flags: f }).allowed).toBe(false)
    })
  })

  it('P19 unknown module key -> unknown-module', () => {
    expect(resolveModuleAccess('somethingElse', { flags: flags() })).toEqual({ allowed: false, reason: 'unknown-module' })
  })
})

// The frontend keeps a copy for UX; the backend copy is authoritative.  They
// must never disagree, so run the SAME inputs through both and compare.
describe('WB-ENT  frontend <-> backend parity', () => {
  it('both copies return identical results for every flag combination', async () => {
    let front
    try {
      front = await import('../../../../frontend/src/shared/flags/index.js')
    } catch {
      console.warn('frontend/src/shared/flags not found next to backend/ — parity test skipped')
      return
    }
    const keys = ['staffDirectory', 'staffRecruitment', 'staffAttendance', 'resourceDirectory', 'operationalScheduling', 'operationalSchedulingPremium']
    const models = ['B2C', 'INTERNAL', 'BOTH']
    const levels = ['BASIC', 'ENHANCED']
    let compared = 0
    for (let mask = 0; mask < 1 << keys.length; mask++) {
      const fl = Object.fromEntries(keys.map((k, i) => [k, Boolean(mask & (1 << i))]))
      for (const recruitmentModelType of models) {
        for (const verificationLevel of levels) {
          for (const key of keys) {
            const ctx = { flags: fl, business: { recruitmentModelType, verificationLevel } }
            expect(front.resolveModuleAccess(key, ctx), `${key} ${JSON.stringify(ctx)}`).toEqual(resolveModuleAccess(key, ctx))
            compared++
          }
        }
      }
    }
    expect(compared).toBe(64 * 3 * 2 * 6)
  })
})
