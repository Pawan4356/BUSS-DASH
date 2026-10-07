/**
 * WHITE-BOX TESTS — src/lib/staffHelpers.js (serialisers)
 * Technique: branch coverage of name joining, responsibilitiesCount and defaults.
 */
import { describe, it, expect } from 'vitest'
import { serializeStaffListItem, serializeStaffDetail, STAFF_DETAIL_INCLUDE } from '../../src/lib/staffHelpers.js'

const base = { id: 's1', accountId: 'A1', title: 'T', employmentType: 'Full-Time', status: 'ACTIVE', archived: false }

describe('WB-STAFF  serializeStaffListItem.name', () => {
  it.each([
    ['first + last', { firstName: 'A', lastName: 'B' }, 'A B'],
    ['first only', { firstName: 'A', lastName: null }, 'A'],
    ['last only', { firstName: null, lastName: 'B' }, 'B'],
    ['neither (invited, not yet filled) -> null', { firstName: null, lastName: null }, null],
    ['empty strings -> null', { firstName: '', lastName: '' }, null],
  ])('%s', (_l, names, expected) => {
    expect(serializeStaffListItem({ ...base, ...names }).name).toBe(expected)
  })
})

describe('WB-STAFF  responsibilitiesCount — every term of the sum', () => {
  const count = (extra) => serializeStaffListItem({ ...base, ...extra }).responsibilitiesCount

  it('no workResponsibility row and no lists -> 0 (undefined lists hit the ?? 0 branches)', () => {
    expect(count({})).toBe(0)
  })
  it('workResponsibility with 0 / 1 / 2 / 3 true flags', () => {
    const wr = (a, b, c) => ({ workResponsibility: { staffRecruitment: a, staffAttendance: b, operationalScheduling: c } })
    expect(count(wr(false, false, false))).toBe(0)
    expect(count(wr(true, false, false))).toBe(1)
    expect(count(wr(true, true, false))).toBe(2)
    expect(count(wr(true, true, true))).toBe(3)
  })
  it('adds workspace and resource responsibilities', () => {
    expect(count({ workspaceResponsibilities: [{}, {}], resourceResponsibilities: [{}] })).toBe(3)
  })
  it('sums all three sources', () => {
    expect(count({
      workResponsibility: { staffRecruitment: true, staffAttendance: true, operationalScheduling: false },
      workspaceResponsibilities: [{}], resourceResponsibilities: [{}, {}],
    })).toBe(5)
  })
})

describe('WB-STAFF  serializeStaffDetail', () => {
  const full = {
    ...base, firstName: 'A', lastName: 'B', phoneNumber: '1', gender: 'F', dateOfBirth: null, profilePhoto: null,
    dateOfJoining: null, yearsOfExperience: 2, qualifications: 'q', pastExperience: 'p', workingSchedule: [],
    workResponsibility: null,
    workspaceResponsibilities: [{ workspace: { id: 'w1', name: 'W' } }],
    resourceResponsibilities: [{ resource: { id: 'r1', name: 'R' } }],
    createdAt: new Date(0), updatedAt: new Date(0),
  }
  it('null workResponsibility -> all-false default object (?? branch)', () => {
    expect(serializeStaffDetail(full).workResponsibility).toEqual({ staffRecruitment: false, staffAttendance: false, operationalScheduling: false })
  })
  it('flattens workspace / resource relations to {id,name}', () => {
    const d = serializeStaffDetail(full)
    expect(d.workspaceResponsibilities).toEqual([{ id: 'w1', name: 'W' }])
    expect(d.resourceResponsibilities).toEqual([{ id: 'r1', name: 'R' }])
  })
  it('includes every list-item field plus the detail fields', () => {
    const d = serializeStaffDetail(full)
    expect(Object.keys(d)).toEqual(expect.arrayContaining(['id', 'accountId', 'name', 'status', 'responsibilitiesCount', 'phoneNumber', 'yearsOfExperience', 'createdAt']))
  })
  it('never exposes businessId (internal tenant key)', () => {
    expect(serializeStaffDetail({ ...full, businessId: 'biz1' })).not.toHaveProperty('businessId')
  })
  it('STAFF_DETAIL_INCLUDE requests all four relations', () => {
    expect(Object.keys(STAFF_DETAIL_INCLUDE).sort()).toEqual(['resourceResponsibilities', 'workResponsibility', 'workingSchedule', 'workspaceResponsibilities'])
  })
})
