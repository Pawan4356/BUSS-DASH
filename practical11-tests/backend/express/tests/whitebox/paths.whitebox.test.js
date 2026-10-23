/**
 * WHITE-BOX TESTS — route handlers (basis-path testing through the real routers).
 * Each test names the branch of the source it is designed to drive and checks
 * INTERNAL state (what the handler wrote / how it wrote it), not only the response.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { buildApp, freshWorld, bearer, fake } from '../helpers/testApp.js'
import { seedStaff, seedSchedule } from '../helpers/fakePrisma.js'

let app
const dir = (m, url) => request(app)[m](`/staff-directory${url}`).set(bearer('acc1'))
const att = (m, url) => request(app)[m](`/staff-attendance${url}`).set(bearer('acc1'))

beforeEach(async () => {
  await freshWorld()
  app = await buildApp()
})

describe('WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14)', () => {
  let id
  beforeEach(async () => {
    id = (await dir('post', '/staff').send({ accountId: 'ACC-P' })).body.id
  })

  it('P1 not found -> early return, nothing written', async () => {
    const tx = vi.spyOn(fake.prisma, '$transaction')
    expect((await dir('patch', '/staff/zzz').send({ title: 'x' })).status).toBe(404)
    expect(tx).not.toHaveBeenCalled()
  })

  it('P2 empty body -> Object.keys(data).length === 0 branch: tx.staff.update is skipped', async () => {
    const upd = vi.spyOn(fake.prisma.staff, 'update')
    await dir('patch', `/staff/${id}`).send({})
    expect(upd).not.toHaveBeenCalled()
  })

  it('P3 scalar fields -> tx.staff.update called exactly once with ONLY whitelisted keys', async () => {
    const upd = vi.spyOn(fake.prisma.staff, 'update')
    await dir('patch', `/staff/${id}`).send({ title: 'T', businessId: 'evil', id: 'evil', foo: 1 })
    expect(upd).toHaveBeenCalledTimes(1)
    expect(Object.keys(upd.mock.calls[0][0].data)).toEqual(['title'])
  })

  it('P4 dateOfBirth / dateOfJoining truthy -> converted to Date objects before saving', async () => {
    await dir('patch', `/staff/${id}`).send({ dateOfBirth: '2000-01-01', dateOfJoining: '2026-01-01' })
    const row = fake.prisma._db.staff.find((s) => s.id === id)
    expect(row.dateOfBirth).toBeInstanceOf(Date)
    expect(row.dateOfJoining).toBeInstanceOf(Date)
  })

  it('P4b dateOfBirth explicitly null -> falsy branch: stored as null (not converted to epoch)', async () => {
    await dir('patch', `/staff/${id}`).send({ dateOfBirth: '2000-01-01' })
    await dir('patch', `/staff/${id}`).send({ dateOfBirth: null })
    expect(fake.prisma._db.staff.find((s) => s.id === id).dateOfBirth).toBeNull()
  })

  it('P5 all child updates happen inside ONE $transaction (atomicity)', async () => {
    const tx = vi.spyOn(fake.prisma, '$transaction')
    await dir('patch', `/staff/${id}`).send({ title: 'T', workingSchedule: [], workResponsibility: { staffAttendance: true } })
    expect(tx).toHaveBeenCalledTimes(1)
  })

  it('P6 schedule: isOff day -> ONE row with isOff=true and no times (true side of the ternary)', async () => {
    await dir('patch', `/staff/${id}`).send({ workingSchedule: [{ dayOfWeek: 'SUN', isOff: true, windows: [{ start: '01:00', end: '02:00' }] }] })
    expect(fake.prisma._db.workingScheduleEntry.filter((e) => e.staffId === id)).toEqual([
      expect.objectContaining({ dayOfWeek: 'SUN', isOff: true, startTime: null, endTime: null }),
    ])
  })

  it('P7 schedule: working day -> one row PER window (false side of the ternary, flatMap)', async () => {
    await dir('patch', `/staff/${id}`).send({
      workingSchedule: [{ dayOfWeek: 'MON', isOff: false, windows: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }, { start: '18:00', end: '20:00' }] }],
    })
    expect(fake.prisma._db.workingScheduleEntry.filter((e) => e.staffId === id)).toHaveLength(3)
  })

  it('P8 schedule: working day with zero windows and empty array -> rows.length === 0 branch: createMany skipped', async () => {
    const spy = vi.spyOn(fake.prisma.workingScheduleEntry, 'createMany')
    await dir('patch', `/staff/${id}`).send({ workingSchedule: [{ dayOfWeek: 'MON', isOff: false, windows: [] }] })
    expect(spy).not.toHaveBeenCalled()
  })

  it('P9 workingSchedule omitted -> existing schedule is NOT deleted', async () => {
    seedSchedule(fake.prisma, id, [{ dayOfWeek: 'MON', startTime: '09:00', endTime: '17:00' }])
    await dir('patch', `/staff/${id}`).send({ title: 'only title' })
    expect(fake.prisma._db.workingScheduleEntry.filter((e) => e.staffId === id)).toHaveLength(1)
  })

  it('P10 workResponsibility: first call -> upsert CREATE path, second call -> UPDATE path', async () => {
    const up = vi.spyOn(fake.prisma.workResponsibility, 'upsert')
    await dir('patch', `/staff/${id}`).send({ workResponsibility: { staffAttendance: true } })
    await dir('patch', `/staff/${id}`).send({ workResponsibility: { staffRecruitment: true } })
    expect(up).toHaveBeenCalledTimes(2)
    expect(fake.prisma._db.workResponsibility.filter((r) => r.staffId === id)).toHaveLength(1)
  })

  it.each([
    ['flag OFF, ids sent', false, { workspaceIds: ['w'], resourceIds: ['r'] }, 0, 0],
    ['flag ON, ids omitted', true, {}, 0, 0],
    ['flag ON, empty arrays (delete, no create)', true, { workspaceIds: [], resourceIds: [] }, 0, 0],
    ['flag ON, non-empty arrays', true, { workspaceIds: ['w1', 'w2'], resourceIds: ['r1'] }, 2, 1],
  ])('P11 %s  (condition coverage of `flags.resourceDirectory && ids`)', async (_l, flagOn, body, ws, rs) => {
    await freshWorld({ resourceDirectory: flagOn })
    const made = (await dir('post', '/staff').send({ accountId: 'ACC-C' })).body.id
    await dir('patch', `/staff/${made}`).send(body)
    expect(fake.prisma._db.workspaceResponsibility.filter((r) => r.staffId === made)).toHaveLength(ws)
    expect(fake.prisma._db.resourceResponsibility.filter((r) => r.staffId === made)).toHaveLength(rs)
  })
})

describe('WB-PATH  GET /staff-directory/staff  (each optional spread is a branch)', () => {
  it('no query -> where contains only businessId + archived:false', async () => {
    const spy = vi.spyOn(fake.prisma.staff, 'findMany')
    await dir('get', '/staff')
    expect(spy.mock.calls[0][0].where).toEqual({ businessId: 'biz1', archived: false })
  })

  it('all query params -> every spread clause is present', async () => {
    const spy = vi.spyOn(fake.prisma.staff, 'findMany')
    await dir('get', '/staff?title=a&status=ACTIVE&employmentType=b&responsibility=staffAttendance&search=c&archived=true')
    const where = spy.mock.calls[0][0].where
    expect(Object.keys(where).sort()).toEqual(['OR', 'archived', 'businessId', 'employmentType', 'status', 'title', 'workResponsibility'])
    expect(where.archived).toBe(true)
    expect(where.OR).toHaveLength(3)
  })

  it('archived=anything-but-"true" is treated as false', async () => {
    const spy = vi.spyOn(fake.prisma.staff, 'findMany')
    await dir('get', '/staff?archived=1')
    expect(spy.mock.calls[0][0].where.archived).toBe(false)
  })

  it('businessId in the query string cannot override the tenant scope', async () => {
    const other = seedStaff(fake.prisma, { businessId: 'biz2', accountId: 'X' })
    const res = await dir('get', `/staff?businessId=biz2`)
    expect(res.body.find((s) => s.id === other.id)).toBeUndefined()
  })
})

describe('WB-PATH  PATCH /staff-attendance/register/:staffId', () => {
  let s
  beforeEach(() => {
    s = seedStaff(fake.prisma, { firstName: 'W' })
    seedSchedule(fake.prisma, s.id, [{ dayOfWeek: 'TUE', startTime: '09:00', endTime: '17:00' }])
  })
  const d = '2026-09-22'

  it('create branch: status defaults to PRESENT when body.status is undefined (?? branch)', async () => {
    const res = await att('patch', `/register/${s.id}?date=${d}`).send({})
    expect(res.body.status).toBe('PRESENT')
  })

  it('create branch: null checkIn / checkOut stored as null, not as a Date', async () => {
    await att('patch', `/register/${s.id}?date=${d}`).send({})
    const rec = fake.prisma._db.attendanceRecord[0]
    expect(rec.checkIn).toBeNull()
    expect(rec.checkOut).toBeNull()
  })

  it('update branch: `checkIn !== undefined` guard — omitted key keeps the stored value', async () => {
    await att('patch', `/register/${s.id}?date=${d}`).send({ checkIn: `${d}T09:00:00.000Z` })
    await att('patch', `/register/${s.id}?date=${d}`).send({ status: 'LEAVE' })
    expect(fake.prisma._db.attendanceRecord[0].checkIn).toEqual(new Date(`${d}T09:00:00.000Z`))
  })

  it('update branch: explicit null clears a previously stored checkOut', async () => {
    await att('patch', `/register/${s.id}?date=${d}`).send({ checkOut: `${d}T17:00:00.000Z` })
    await att('patch', `/register/${s.id}?date=${d}`).send({ checkOut: null })
    expect(fake.prisma._db.attendanceRecord[0].checkOut).toBeNull()
  })

  it('update branch: explicit null clears a previously stored checkIn', async () => {
    await att('patch', `/register/${s.id}?date=${d}`).send({ checkIn: `${d}T09:00:00.000Z` })
    await att('patch', `/register/${s.id}?date=${d}`).send({ checkIn: null })
    expect(fake.prisma._db.attendanceRecord[0].checkIn).toBeNull()
  })

  it('register row: invited staff without a name -> name is null (|| null branch)', async () => {
    seedStaff(fake.prisma, { firstName: null, lastName: null, status: 'PENDING' })
    const res = await att('get', `/register?date=${d}`)
    expect(res.body.rows.some((r) => r.name === null)).toBe(true)
  })

  it('update branch: falsy status is ignored (`...(status && {status})`)', async () => {
    await att('patch', `/register/${s.id}?date=${d}`).send({ status: 'LEAVE' })
    await att('patch', `/register/${s.id}?date=${d}`).send({ status: '' })
    expect(fake.prisma._db.attendanceRecord[0].status).toBe('LEAVE')
  })

  it('record is always stored with the caller\'s businessId', async () => {
    await att('patch', `/register/${s.id}?date=${d}`).send({})
    expect(fake.prisma._db.attendanceRecord[0].businessId).toBe('biz1')
  })

  it('schedule lookup uses ONLY isOff:false windows of that weekday, ordered by startTime', async () => {
    const spy = vi.spyOn(fake.prisma.workingScheduleEntry, 'findMany')
    await att('patch', `/register/${s.id}?date=${d}`).send({})
    expect(spy.mock.calls[0][0]).toMatchObject({ where: { staffId: s.id, dayOfWeek: 'TUE', isOff: false }, orderBy: { startTime: 'asc' } })
  })
})

describe('WB-PATH  GET /staff-attendance/staff/:id/history — month arithmetic', () => {
  it('builds [start, end) with end = start + 1 month (incl. December -> January rollover)', async () => {
    const s = seedStaff(fake.prisma, { firstName: 'H' })
    const spy = vi.spyOn(fake.prisma.attendanceRecord, 'findMany')
    await att('get', `/staff/${s.id}/history?month=2026-12`)
    const { gte, lt } = spy.mock.calls[0][0].where.date
    expect(gte.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(lt.toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })
})
