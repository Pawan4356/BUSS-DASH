/**
 * BLACK-BOX TESTS — Module 3: Staff Attendance Management
 * Techniques: EP, BVA (late / early thresholds, month edges), Decision table
 *             (status), State-based (check-in -> check-out), Tenant isolation.
 *
 * Reference date used everywhere: Tue 22-09-2026 (same date as the Practical-10 output).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { buildApp, freshWorld, bearer, fake } from '../helpers/testApp.js'
import { seedBusiness, seedAccount, seedStaff, seedSchedule } from '../helpers/fakePrisma.js'

const DATE = '2026-09-22' // a TUESDAY
const at = (hhmm) => `${DATE}T${hhmm}:00.000Z` // TZ is pinned to UTC in tests/helpers/setup.js

let app
let rohan
const api = (m, url) => request(app)[m](`/staff-attendance${url}`).set(bearer('acc1'))
const mark = (staffId, body, date = DATE) => api('patch', `/register/${staffId}?date=${date}`).send(body)

beforeEach(async () => {
  await freshWorld()
  app = await buildApp()
  rohan = seedStaff(fake.prisma, { firstName: 'Rohan', lastName: 'Patel', title: 'Software Engineer' })
  seedSchedule(fake.prisma, rohan.id, [{ dayOfWeek: 'TUE', startTime: '09:00', endTime: '17:00' }])
})

describe('BB-ATT  Register  GET /register', () => {
  it('TC-T01 staff with no record default to ABSENT with no times', async () => {
    const res = await api('get', `/register?date=${DATE}`)
    expect(res.status).toBe(200)
    expect(res.body.date).toBe(DATE)
    expect(res.body.rows).toHaveLength(1)
    expect(res.body.rows[0]).toMatchObject({ staffId: rohan.id, name: 'Rohan Patel', checkIn: null, checkOut: null, status: 'ABSENT', stayTimeMinutes: null })
  })

  it("TC-T02 row shows the working schedule for THAT weekday only", async () => {
    seedSchedule(fake.prisma, rohan.id, [{ dayOfWeek: 'WED', startTime: '10:00', endTime: '14:00' }])
    const tue = await api('get', `/register?date=${DATE}`)
    expect(tue.body.rows[0].workingSchedule).toEqual([{ start: '09:00', end: '17:00' }])
    const wed = await api('get', '/register?date=2026-09-23')
    expect(wed.body.rows[0].workingSchedule).toEqual([{ start: '10:00', end: '14:00' }])
  })

  it('TC-T03 a day marked OFF is reported as { isOff: true }', async () => {
    seedSchedule(fake.prisma, rohan.id, [{ dayOfWeek: 'SUN', isOff: true }])
    const res = await api('get', '/register?date=2026-09-27') // Sunday
    expect(res.body.rows[0].workingSchedule).toEqual([{ isOff: true }])
  })

  it('TC-T04 search by first/last name (case-insensitive)', async () => {
    seedStaff(fake.prisma, { firstName: 'Aditi', lastName: 'Shah' })
    expect((await api('get', `/register?date=${DATE}&search=PATEL`)).body.rows.map((r) => r.name)).toEqual(['Rohan Patel'])
    expect((await api('get', `/register?date=${DATE}&search=adi`)).body.rows.map((r) => r.name)).toEqual(['Aditi Shah'])
  })

  it('TC-T05 filter by status', async () => {
    const aditi = seedStaff(fake.prisma, { firstName: 'Aditi', lastName: 'Shah' })
    await mark(rohan.id, { checkIn: at('09:00') })
    const present = await api('get', `/register?date=${DATE}&status=PRESENT`)
    expect(present.body.rows.map((r) => r.staffId)).toEqual([rohan.id])
    const absent = await api('get', `/register?date=${DATE}&status=ABSENT`)
    expect(absent.body.rows.map((r) => r.staffId)).toEqual([aditi.id])
  })

  it('TC-T06 archived staff are not listed', async () => {
    seedStaff(fake.prisma, { firstName: 'Gone', archived: true })
    expect((await api('get', `/register?date=${DATE}`)).body.rows).toHaveLength(1)
  })

  it('TC-T07 other businesses\' staff are never listed', async () => {
    seedBusiness(fake.prisma, { id: 'biz3' })
    seedStaff(fake.prisma, { businessId: 'biz3', firstName: 'Foreign' })
    expect((await api('get', `/register?date=${DATE}`)).body.rows.map((r) => r.name)).toEqual(['Rohan Patel'])
  })
})

describe('BB-ATT  Check-in / check-out  PATCH /register/:staffId', () => {
  it('TC-T08 check-in creates a record, default status PRESENT, stay time not yet known', async () => {
    const res = await mark(rohan.id, { checkIn: at('09:00') })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ staffId: rohan.id, status: 'PRESENT', stayTimeMinutes: null, checkOut: null })
    expect(res.body.checkIn).toBe(at('09:00'))
  })

  it('TC-T09 check-out after check-in calculates stay time (Practical-10 example: 09:15 -> 18:05 = 8.83 h)', async () => {
    await mark(rohan.id, { checkIn: at('09:15') })
    const res = await mark(rohan.id, { checkOut: at('18:05') })
    expect(res.body.stayTimeMinutes).toBe(530)
    expect(+(res.body.stayTimeMinutes / 60).toFixed(2)).toBe(8.83)
  })

  it('TC-T10 check-in and check-out in one request', async () => {
    const res = await mark(rohan.id, { checkIn: at('09:00'), checkOut: at('17:00') })
    expect(res.body.stayTimeMinutes).toBe(480)
  })

  it('TC-T11 marking the same staff+date twice updates ONE record (no duplicates)', async () => {
    await mark(rohan.id, { checkIn: at('09:00') })
    await mark(rohan.id, { checkOut: at('17:00') })
    expect(fake.prisma._db.attendanceRecord).toHaveLength(1)
  })

  it('TC-T12 BVA stay time: check-out == check-in -> 0 minutes', async () => {
    const res = await mark(rohan.id, { checkIn: at('09:00'), checkOut: at('09:00') })
    expect(res.body.stayTimeMinutes).toBe(0)
  })

  it('TC-T13 BVA stay time: 1 minute', async () => {
    const res = await mark(rohan.id, { checkIn: at('09:00'), checkOut: at('09:01') })
    expect(res.body.stayTimeMinutes).toBe(1)
  })

  it('TC-T14 check-out BEFORE check-in never produces a negative stay time', async () => {
    const res = await mark(rohan.id, { checkIn: at('17:00'), checkOut: at('09:00') })
    expect(res.body.stayTimeMinutes).toBe(0)
  })

  it('TC-T15 stay time is rounded to whole minutes', async () => {
    const res = await mark(rohan.id, { checkIn: '2026-09-22T09:00:00.000Z', checkOut: '2026-09-22T09:00:40.000Z' })
    expect(res.body.stayTimeMinutes).toBe(1) // 40 s -> 1 min
  })

  it('TC-T16 unknown staff -> 404', async () => {
    const res = await mark('nope', { checkIn: at('09:00') })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Staff member not found')
  })

  it('TC-T17 staff of another business -> 404', async () => {
    seedBusiness(fake.prisma, { id: 'biz3' })
    const foreign = seedStaff(fake.prisma, { businessId: 'biz3' })
    expect((await mark(foreign.id, { checkIn: at('09:00') })).status).toBe(404)
    expect(fake.prisma._db.attendanceRecord).toHaveLength(0)
  })

  it('TC-T18 records for different dates are independent', async () => {
    await mark(rohan.id, { checkIn: at('09:00') }, '2026-09-22')
    await mark(rohan.id, { checkIn: '2026-09-23T09:00:00.000Z' }, '2026-09-23')
    expect(fake.prisma._db.attendanceRecord).toHaveLength(2)
  })
})

describe('BB-ATT  Attendance status (Present / Absent / Leave / Off)', () => {
  it.each(['PRESENT', 'ABSENT', 'LEAVE', 'OFF'])('TC-T19 manager can set status %s', async (status) => {
    const res = await mark(rohan.id, { status })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe(status)
  })

  it('TC-T20 status can be corrected afterwards', async () => {
    await mark(rohan.id, { status: 'LEAVE' })
    expect((await mark(rohan.id, { status: 'PRESENT' })).body.status).toBe('PRESENT')
  })

  it('TC-T21 an explicit status is kept when times are added later', async () => {
    await mark(rohan.id, { status: 'LEAVE' })
    const res = await mark(rohan.id, { checkOut: at('17:00') })
    expect(res.body.status).toBe('LEAVE')
  })
})

describe('BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00)', () => {
  it.each([
    ['08:59', false],
    ['09:00', false], // exactly on time
    ['09:01', true],
    ['09:15', true],
  ])('TC-T22 check-in %s -> lateCheckIn=%s', async (time, late) => {
    const res = await mark(rohan.id, { checkIn: at(time) })
    expect(res.body.lateCheckIn).toBe(late)
  })

  it.each([
    ['16:59', true],
    ['17:00', false], // exactly on time
    ['17:01', false],
    ['12:00', true],
  ])('TC-T23 check-out %s -> earlyCheckOut=%s', async (time, early) => {
    const res = await mark(rohan.id, { checkOut: at(time) })
    expect(res.body.earlyCheckOut).toBe(early)
  })

  it('TC-T24 staff with NO schedule for that day is never late / early', async () => {
    const other = seedStaff(fake.prisma, { firstName: 'NoSched' })
    const res = await mark(other.id, { checkIn: at('23:00'), checkOut: at('23:05') })
    expect(res.body).toMatchObject({ lateCheckIn: false, earlyCheckOut: false })
  })

  it('TC-T25 a day marked OFF has no working window -> not late / early', async () => {
    const other = seedStaff(fake.prisma, { firstName: 'OffDay' })
    seedSchedule(fake.prisma, other.id, [{ dayOfWeek: 'TUE', isOff: true }])
    const res = await mark(other.id, { checkIn: at('14:00') })
    expect(res.body.lateCheckIn).toBe(false)
  })

  it('TC-T26 late AND early in the same request', async () => {
    const res = await mark(rohan.id, { checkIn: at('10:00'), checkOut: at('15:00') })
    expect(res.body).toMatchObject({ lateCheckIn: true, earlyCheckOut: true })
  })
})

describe('BB-ATT  Today\'s summary  GET /summary', () => {
  const today = () => new Date().toISOString().slice(0, 10)
  const markToday = (id, body) => api('patch', `/register/${id}`).send(body)

  it('TC-T27 staff with no record today count as ABSENT', async () => {
    seedStaff(fake.prisma, { firstName: 'B' })
    const res = await api('get', '/summary')
    expect(res.body).toEqual({ totalStaff: 2, presentToday: 0, absentToday: 2, onLeave: 0, offToday: 0, lateCheckIns: 0, earlyCheckOuts: 0 })
  })

  it('TC-T28 counts every status and late / early totals', async () => {
    const a = seedStaff(fake.prisma, { firstName: 'A' })
    const b = seedStaff(fake.prisma, { firstName: 'B' })
    const c = seedStaff(fake.prisma, { firstName: 'C' })
    const d = seedStaff(fake.prisma, { firstName: 'D' }) // no record -> absent
    // Give everyone a schedule for every weekday so late/early can trigger whatever 'today' is
    for (const s of [rohan, a, b, c, d]) {
      for (const day of ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']) {
        if (!(s === rohan && day === 'TUE')) seedSchedule(fake.prisma, s.id, [{ dayOfWeek: day, startTime: '09:00', endTime: '17:00' }])
      }
    }
    const t = today()
    await markToday(rohan.id, { checkIn: `${t}T10:00:00.000Z`, checkOut: `${t}T18:00:00.000Z` }) // present, late
    await markToday(a.id, { checkIn: `${t}T09:00:00.000Z`, checkOut: `${t}T15:00:00.000Z` }) // present, early
    await markToday(b.id, { status: 'LEAVE' })
    await markToday(c.id, { status: 'OFF' })
    const res = await api('get', '/summary')
    expect(res.body).toMatchObject({ totalStaff: 5, presentToday: 2, onLeave: 1, offToday: 1, absentToday: 1 })
    expect(res.body.lateCheckIns).toBeGreaterThanOrEqual(1)
    expect(res.body.earlyCheckOuts).toBeGreaterThanOrEqual(1)
  })

  it('TC-T29 archived staff are excluded from the summary', async () => {
    seedStaff(fake.prisma, { firstName: 'Gone', archived: true })
    expect((await api('get', '/summary')).body.totalStaff).toBe(1)
  })

  it('TC-T30 summary is scoped to the caller\'s business', async () => {
    seedBusiness(fake.prisma, { id: 'biz3' })
    seedStaff(fake.prisma, { businessId: 'biz3' })
    expect((await api('get', '/summary')).body.totalStaff).toBe(1)
  })
})

describe('BB-ATT  Attendance history  GET /staff/:staffId/history', () => {
  beforeEach(async () => {
    await mark(rohan.id, { checkIn: '2026-09-01T09:00:00.000Z', checkOut: '2026-09-01T17:00:00.000Z' }, '2026-09-01')
    await mark(rohan.id, { checkIn: '2026-09-30T09:00:00.000Z' }, '2026-09-30')
    await mark(rohan.id, { checkIn: '2026-10-01T09:00:00.000Z' }, '2026-10-01')
    await mark(rohan.id, { checkIn: '2026-08-31T09:00:00.000Z' }, '2026-08-31')
  })

  it('TC-T31 returns the month\'s records in ascending date order with stay time', async () => {
    const res = await api('get', `/staff/${rohan.id}/history?month=2026-09`)
    expect(res.status).toBe(200)
    expect(res.body.map((r) => r.date)).toEqual(['2026-09-01', '2026-09-30'])
    expect(res.body[0]).toMatchObject({ status: 'PRESENT', stayTimeMinutes: 480 })
    expect(res.body[1].stayTimeMinutes).toBeNull()
  })

  it('TC-T32 BVA month edges: 1st and last day included, previous / next month excluded', async () => {
    const res = await api('get', `/staff/${rohan.id}/history?month=2026-09`)
    const dates = res.body.map((r) => r.date)
    expect(dates).toContain('2026-09-01')
    expect(dates).toContain('2026-09-30')
    expect(dates).not.toContain('2026-08-31')
    expect(dates).not.toContain('2026-10-01')
  })

  it('TC-T33 month with no records -> empty array', async () => {
    expect((await api('get', `/staff/${rohan.id}/history?month=2025-01`)).body).toEqual([])
  })

  it('TC-T34 no month given -> defaults to the current month (200)', async () => {
    expect((await api('get', `/staff/${rohan.id}/history`)).status).toBe(200)
  })

  it('TC-T35 unknown staff -> 404', async () => {
    expect((await api('get', '/staff/ghost/history?month=2026-09')).status).toBe(404)
  })

  it('TC-T36 history of another business\'s staff -> 404', async () => {
    seedBusiness(fake.prisma, { id: 'biz3' })
    const foreign = seedStaff(fake.prisma, { businessId: 'biz3' })
    expect((await api('get', `/staff/${foreign.id}/history`)).status).toBe(404)
  })
})

describe('BB-ATT  Access control', () => {
  it.each([
    ['get', '/summary'], ['get', '/register'], ['patch', '/register/x'], ['get', '/staff/x/history'],
  ])('TC-T37 %s %s without token -> 401', async (m, url) => {
    expect((await request(app)[m](`/staff-attendance${url}`)).status).toBe(401)
  })

  it('TC-T38 Staff Attendance not purchased -> 403 with reason', async () => {
    const res = await request(app).get('/staff-attendance/summary').set(bearer('acc2'))
    expect(res.status).toBe(403)
    expect(res.body.reason).toBe('not-purchased')
  })

  it('TC-T39 buying ONLY Staff Directory does not unlock attendance', async () => {
    await freshWorld({ staffDirectory: true, staffAttendance: false })
    expect((await request(app).get('/staff-attendance/register').set(bearer('acc1'))).status).toBe(403)
  })
})
