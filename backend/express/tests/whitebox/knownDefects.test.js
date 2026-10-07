/**
 * KNOWN DEFECTS found by reading the source (white-box) and comparing it with
 * dashboard-system-spec-draft-v1.md.
 *
 * Each test asserts the CORRECT / SPEC-CONFORMING behaviour and is wrapped in
 * `it(...)`: the suite stays green while the defect exists, and the moment
 * the code is fixed the test starts "unexpectedly passing" -> remove `.fails`.
 * (To see the raw failures, temporarily change `it.fails` to `it`.)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { buildApp, freshWorld, bearer, fake } from '../helpers/testApp.js'
import { seedAccount, seedStaff, seedSchedule } from '../helpers/fakePrisma.js'

const DATE = '2026-09-22' // Tuesday
const at = (hhmm) => `${DATE}T${hhmm}:00.000Z`
let app
const att = (m, url) => request(app)[m](`/staff-attendance${url}`).set(bearer('acc1'))
const dir = (m, url) => request(app)[m](`/staff-directory${url}`).set(bearer('acc1'))

beforeEach(async () => {
  await freshWorld()
  app = await buildApp()
})

describe('DEF  Staff Attendance', () => {
  it.fails('DEF-01 late flag must survive a later check-out-only update (lateCheckIn is recomputed from an undefined checkIn and reset to false)', async () => {
    const s = seedStaff(fake.prisma, { firstName: 'Late' })
    seedSchedule(fake.prisma, s.id, [{ dayOfWeek: 'TUE', startTime: '09:00', endTime: '17:00' }])
    const first = await att('patch', `/register/${s.id}?date=${DATE}`).send({ checkIn: at('10:00') })
    expect(first.body.lateCheckIn).toBe(true)
    const second = await att('patch', `/register/${s.id}?date=${DATE}`).send({ checkOut: at('17:30') })
    expect(second.body.lateCheckIn).toBe(true) // actual: false
  })

  it.fails('DEF-02 (mirror) early flag must survive a later check-in-only update', async () => {
    const s = seedStaff(fake.prisma, { firstName: 'Early' })
    seedSchedule(fake.prisma, s.id, [{ dayOfWeek: 'TUE', startTime: '09:00', endTime: '17:00' }])
    await att('patch', `/register/${s.id}?date=${DATE}`).send({ checkOut: at('15:00') })
    const res = await att('patch', `/register/${s.id}?date=${DATE}`).send({ checkIn: at('09:00') })
    expect(res.body.earlyCheckOut).toBe(true) // actual: false
  })

  it.fails('DEF-03 split shift: leaving at 15:00 during the 14:00-18:00 window is an early check-out (code compares only against the FIRST window end 13:00)', async () => {
    const s = seedStaff(fake.prisma, { firstName: 'Split' })
    seedSchedule(fake.prisma, s.id, [
      { dayOfWeek: 'TUE', startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 'TUE', startTime: '14:00', endTime: '18:00' },
    ])
    const res = await att('patch', `/register/${s.id}?date=${DATE}`).send({ checkIn: at('09:00'), checkOut: at('15:00') })
    expect(res.body.earlyCheckOut).toBe(true) // actual: false
  })

  it.fails('DEF-04 invalid ?date must be rejected with 400 (currently RangeError -> 500)', async () => {
    const res = await att('get', '/register?date=not-a-date')
    expect(res.status).toBe(400)
  })

  it.fails('DEF-05 register date must echo the requested calendar day in non-UTC servers (Asia/Kolkata gives the previous day)', async () => {
    const previous = process.env.TZ
    process.env.TZ = 'Asia/Kolkata'
    try {
      const res = await att('get', `/register?date=${DATE}`)
      expect(res.body.date).toBe(DATE) // actual: 2026-09-21
    } finally {
      process.env.TZ = previous
    }
  })

  it.fails('DEF-06 an unknown attendance status must be rejected with 400 (fake DB stores it; real Prisma enum would surface a 500)', async () => {
    const s = seedStaff(fake.prisma, { firstName: 'X' })
    const res = await att('patch', `/register/${s.id}?date=${DATE}`).send({ status: 'BOGUS' })
    expect(res.status).toBe(400)
  })
})

describe('DEF  Staff Directory / role & entitlement rules from the spec', () => {
  it.fails('DEF-07 spec §5 "Holder role: Staff Manager" — an account with role STAFF must not be able to delete staff', async () => {
    seedAccount(fake.prisma, { id: 'accStaff', businessId: 'biz1', email: 'staff@demo.test', passwordHash: 'x', role: 'STAFF' })
    const s = seedStaff(fake.prisma, { firstName: 'Victim' })
    const res = await request(app).delete(`/staff-directory/staff/${s.id}`).set(bearer('accStaff'))
    expect(res.status).toBe(403) // actual: 204
  })

  it.fails('DEF-08 spec §7 "Holder role: Attendance Manager" — an account with role STAFF must not be able to edit attendance', async () => {
    seedAccount(fake.prisma, { id: 'accStaff', businessId: 'biz1', email: 'staff@demo.test', passwordHash: 'x', role: 'STAFF' })
    const s = seedStaff(fake.prisma, { firstName: 'Target' })
    const res = await request(app).patch(`/staff-attendance/register/${s.id}?date=${DATE}`).set(bearer('accStaff')).send({ status: 'ABSENT' })
    expect(res.status).toBe(403) // actual: 200
  })

  it.fails('DEF-09 spec §5 Work-Responsibility checklist is subscription-gated — "Staff Recruitment" must not be assignable when staff_recruitment is not purchased', async () => {
    const { id } = (await dir('post', '/staff').send({ accountId: 'ACC-W' })).body
    const res = await dir('patch', `/staff/${id}`).send({ workResponsibility: { staffRecruitment: true } })
    expect(res.body.workResponsibility.staffRecruitment).toBe(false) // actual: true
  })

  it.fails('DEF-10 the same account_id should not be invitable twice in one business', async () => {
    await dir('post', '/staff').send({ accountId: 'ACC-DUP' })
    const again = await dir('post', '/staff').send({ accountId: 'ACC-DUP' })
    expect(again.status).toBe(409) // actual: 201 (duplicate row created)
  })
})
