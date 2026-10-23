/**
 * BLACK-BOX TESTS — Module 2: Staff Directory Management
 * Techniques: EP, BVA, State-transition (PENDING->ACTIVE->archived->deleted),
 *             CRUD life-cycle, Multi-tenant isolation, Error guessing.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { buildApp, freshWorld, bearer, fake } from '../helpers/testApp.js'
import { seedBusiness, seedAccount, seedStaff } from '../helpers/fakePrisma.js'

let app
const auth = () => bearer('acc1')
const api = (m, url) => request(app)[m](`/staff-directory${url}`).set(auth())

beforeEach(async () => {
  await freshWorld()
  app = await buildApp()
})

describe('BB-STAFF  Invite / create staff  POST /staff', () => {
  it('TC-S01 invite with accountId -> 201, status PENDING, empty profile', async () => {
    const res = await api('post', '/staff').send({ accountId: 'ACC-2001' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ accountId: 'ACC-2001', status: 'PENDING', archived: false, name: null, responsibilitiesCount: 0 })
    expect(res.body.id).toBeTruthy()
  })

  it.each([
    ['missing accountId', {}],
    ['empty accountId', { accountId: '' }],
    ['null accountId', { accountId: null }],
  ])('TC-S02 %s -> 400', async (_l, body) => {
    const res = await api('post', '/staff').send(body)
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('accountId is required')
  })

  it('TC-S03 staff is created inside the caller\'s business only', async () => {
    const res = await api('post', '/staff').send({ accountId: 'ACC-2002' })
    expect(fake.prisma._db.staff.find((s) => s.id === res.body.id).businessId).toBe('biz1')
  })
})

describe('BB-STAFF  List / search / filter  GET /staff', () => {
  beforeEach(() => {
    seedStaff(fake.prisma, { accountId: 'ACC-1', firstName: 'Aditi', lastName: 'Sharma', title: 'Front Desk Manager', employmentType: 'Full-Time', status: 'ACTIVE', createdAt: new Date('2026-01-01') })
    seedStaff(fake.prisma, { accountId: 'ACC-2', firstName: 'Rohan', lastName: 'Mehta', title: 'Staff Nurse', employmentType: 'Part-Time', status: 'ON_LEAVE', createdAt: new Date('2026-02-01') })
    seedStaff(fake.prisma, { accountId: 'ACC-3', firstName: 'Priya', lastName: 'Nair', title: 'Receptionist', employmentType: 'Full-Time', status: 'PENDING', createdAt: new Date('2026-03-01') })
    seedStaff(fake.prisma, { accountId: 'ACC-4', firstName: 'Old', lastName: 'Timer', title: 'Driver', archived: true, createdAt: new Date('2026-04-01') })
    fake.prisma._db.workResponsibility.push({ staffId: fake.prisma._db.staff[0].id, staffRecruitment: true, staffAttendance: false, operationalScheduling: false })
  })

  it('TC-S04 default list excludes archived staff, newest first', async () => {
    const res = await api('get', '/staff')
    expect(res.status).toBe(200)
    expect(res.body.map((s) => s.accountId)).toEqual(['ACC-3', 'ACC-2', 'ACC-1'])
  })

  it('TC-S05 list item exposes id, name, title, employmentType, status, responsibilitiesCount', async () => {
    const res = await api('get', '/staff')
    const aditi = res.body.find((s) => s.accountId === 'ACC-1')
    expect(aditi).toMatchObject({ name: 'Aditi Sharma', title: 'Front Desk Manager', employmentType: 'Full-Time', status: 'ACTIVE', responsibilitiesCount: 1 })
  })

  it.each([
    ['search first name (case-insensitive)', '?search=ADITI', ['ACC-1']],
    ['search last name', '?search=mehta', ['ACC-2']],
    ['search by account id', '?search=ACC-3', ['ACC-3']],
    ['search with no match', '?search=zzz', []],
    ['filter title (partial)', '?title=nurse', ['ACC-2']],
    ['filter status', '?status=PENDING', ['ACC-3']],
    ['filter employment type', '?employmentType=full', ['ACC-3', 'ACC-1']],
    ['filter responsibility', '?responsibility=staffRecruitment', ['ACC-1']],
    ['archived=true shows only archived', '?archived=true', ['ACC-4']],
    ['combined filters (AND)', '?employmentType=Full-Time&status=ACTIVE', ['ACC-1']],
  ])('TC-S06 %s', async (_l, qs, expected) => {
    const res = await api('get', `/staff${qs}`)
    expect(res.status).toBe(200)
    expect(res.body.map((s) => s.accountId)).toEqual(expected)
  })

  it('TC-S07 staff of another business are never returned (tenant isolation)', async () => {
    seedBusiness(fake.prisma, { id: 'biz3' })
    seedStaff(fake.prisma, { businessId: 'biz3', accountId: 'ACC-OTHER', firstName: 'Secret' })
    const res = await api('get', '/staff')
    expect(res.body.find((s) => s.accountId === 'ACC-OTHER')).toBeUndefined()
  })
})

describe('BB-STAFF  View profile  GET /staff/:id', () => {
  it('TC-S08 existing id -> 200 full detail incl. schedule + responsibility defaults', async () => {
    const s = seedStaff(fake.prisma, { firstName: 'Aditi', lastName: 'Sharma' })
    const res = await api('get', `/staff/${s.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: s.id, firstName: 'Aditi', workingSchedule: [] })
    expect(res.body.workResponsibility).toEqual({ staffRecruitment: false, staffAttendance: false, operationalScheduling: false })
  })

  it('TC-S09 unknown id -> 404', async () => {
    const res = await api('get', '/staff/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Staff member not found')
  })

  it('TC-S10 staff that belongs to another business -> 404 (not 403, no existence leak)', async () => {
    seedBusiness(fake.prisma, { id: 'biz3' })
    const foreign = seedStaff(fake.prisma, { businessId: 'biz3' })
    const res = await api('get', `/staff/${foreign.id}`)
    expect(res.status).toBe(404)
  })
})

describe('BB-STAFF  Update profile  PATCH /staff/:id', () => {
  let staff
  beforeEach(async () => {
    staff = (await api('post', '/staff').send({ accountId: 'ACC-9' })).body
  })

  it('TC-S11 update general + professional details (PENDING -> ACTIVE)', async () => {
    const res = await api('patch', `/staff/${staff.id}`).send({
      firstName: 'Neha', lastName: 'Kulkarni', phoneNumber: '+91 90000 00000', gender: 'Female',
      title: 'Nurse', employmentType: 'Full-Time', yearsOfExperience: 3.5,
      qualifications: 'B.Sc Nursing', pastExperience: 'City Hospital', status: 'ACTIVE',
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ name: 'Neha Kulkarni', title: 'Nurse', status: 'ACTIVE', yearsOfExperience: 3.5, employmentType: 'Full-Time' })
  })

  it('TC-S12 dates are accepted as ISO strings', async () => {
    const res = await api('patch', `/staff/${staff.id}`).send({ dateOfBirth: '1998-04-10', dateOfJoining: '2026-01-05' })
    expect(res.status).toBe(200)
    expect(res.body.dateOfBirth).toMatch(/^1998-04-10/)
    expect(res.body.dateOfJoining).toMatch(/^2026-01-05/)
  })

  it('TC-S13 BVA yearsOfExperience = 0 is stored (falsy but valid)', async () => {
    const res = await api('patch', `/staff/${staff.id}`).send({ yearsOfExperience: 0 })
    expect(res.body.yearsOfExperience).toBe(0)
  })

  it('TC-S14 partial update leaves other fields untouched', async () => {
    await api('patch', `/staff/${staff.id}`).send({ firstName: 'A', title: 'T' })
    const res = await api('patch', `/staff/${staff.id}`).send({ title: 'T2' })
    expect(res.body).toMatchObject({ firstName: 'A', title: 'T2' })
  })

  it('TC-S15 empty body is a no-op -> 200, unchanged', async () => {
    const res = await api('patch', `/staff/${staff.id}`).send({})
    expect(res.status).toBe(200)
    expect(res.body.accountId).toBe('ACC-9')
  })

  it('TC-S16 protected fields (id, businessId, accountId) cannot be changed', async () => {
    const res = await api('patch', `/staff/${staff.id}`).send({ id: 'hack', businessId: 'biz2', accountId: 'HACK' })
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(staff.id)
    expect(res.body.accountId).toBe('ACC-9')
    expect(fake.prisma._db.staff.find((s) => s.id === staff.id).businessId).toBe('biz1')
  })

  it('TC-S17 unknown id -> 404', async () => {
    const res = await api('patch', '/staff/nope').send({ title: 'x' })
    expect(res.status).toBe(404)
  })

  it('TC-S18 cannot update staff of another business -> 404', async () => {
    seedBusiness(fake.prisma, { id: 'biz3' })
    const foreign = seedStaff(fake.prisma, { businessId: 'biz3', title: 'orig' })
    const res = await api('patch', `/staff/${foreign.id}`).send({ title: 'pwned' })
    expect(res.status).toBe(404)
    expect(foreign.title).toBe('orig')
  })
})

describe('BB-STAFF  Working schedule  (PATCH workingSchedule)', () => {
  let id
  beforeEach(async () => {
    id = (await api('post', '/staff').send({ accountId: 'ACC-S' })).body.id
  })

  it('TC-S19 set Mon-Fri 09:00-17:00 and a day off on Sat', async () => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d) => ({ dayOfWeek: d, isOff: false, windows: [{ start: '09:00', end: '17:00' }] }))
    days.push({ dayOfWeek: 'SAT', isOff: true, windows: [] })
    const res = await api('patch', `/staff/${id}`).send({ workingSchedule: days })
    expect(res.status).toBe(200)
    expect(res.body.workingSchedule).toHaveLength(6)
    expect(res.body.workingSchedule.find((e) => e.dayOfWeek === 'SAT')).toMatchObject({ isOff: true })
    expect(res.body.workingSchedule.find((e) => e.dayOfWeek === 'MON')).toMatchObject({ startTime: '09:00', endTime: '17:00' })
  })

  it('TC-S20 a day may have several windows (split shift)', async () => {
    const res = await api('patch', `/staff/${id}`).send({
      workingSchedule: [{ dayOfWeek: 'MON', isOff: false, windows: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] }],
    })
    expect(res.body.workingSchedule).toHaveLength(2)
  })

  it('TC-S21 saving a new schedule REPLACES the old one', async () => {
    await api('patch', `/staff/${id}`).send({ workingSchedule: [{ dayOfWeek: 'MON', isOff: false, windows: [{ start: '09:00', end: '17:00' }] }] })
    const res = await api('patch', `/staff/${id}`).send({ workingSchedule: [{ dayOfWeek: 'TUE', isOff: false, windows: [{ start: '10:00', end: '14:00' }] }] })
    expect(res.body.workingSchedule).toHaveLength(1)
    expect(res.body.workingSchedule[0].dayOfWeek).toBe('TUE')
  })

  it('TC-S22 empty schedule array clears the schedule', async () => {
    await api('patch', `/staff/${id}`).send({ workingSchedule: [{ dayOfWeek: 'MON', isOff: false, windows: [{ start: '09:00', end: '17:00' }] }] })
    const res = await api('patch', `/staff/${id}`).send({ workingSchedule: [] })
    // NOTE: `[]` is truthy in JS so the existing rows are deleted and nothing is re-inserted.
    expect(res.body.workingSchedule).toEqual([])
  })
})

describe('BB-STAFF  Assign responsibility', () => {
  let id
  beforeEach(async () => {
    id = (await api('post', '/staff').send({ accountId: 'ACC-R' })).body.id
  })

  it('TC-S23 work-responsibility checklist is saved and counted', async () => {
    const res = await api('patch', `/staff/${id}`).send({ workResponsibility: { staffAttendance: true, operationalScheduling: true } })
    expect(res.body.workResponsibility).toMatchObject({ staffRecruitment: false, staffAttendance: true, operationalScheduling: true })
    expect(res.body.responsibilitiesCount).toBe(2)
  })

  it('TC-S24 updating the checklist again changes the existing row (upsert)', async () => {
    await api('patch', `/staff/${id}`).send({ workResponsibility: { staffAttendance: true } })
    const res = await api('patch', `/staff/${id}`).send({ workResponsibility: { staffAttendance: false } })
    expect(res.body.responsibilitiesCount).toBe(0)
    expect(fake.prisma._db.workResponsibility.filter((r) => r.staffId === id)).toHaveLength(1)
  })

  it('TC-S25 workspace/resource responsibilities are IGNORED when Resource Directory is not purchased', async () => {
    const res = await api('patch', `/staff/${id}`).send({ workspaceIds: ['w1'], resourceIds: ['r1', 'r2'] })
    expect(res.status).toBe(200)
    expect(res.body.workspaceResponsibilities).toEqual([])
    expect(res.body.resourceResponsibilities).toEqual([])
  })

  it('TC-S26 workspace/resource responsibilities are saved when Resource Directory IS purchased', async () => {
    await freshWorld({ resourceDirectory: true })
    const created = (await api('post', '/staff').send({ accountId: 'ACC-RD' })).body
    const res = await api('patch', `/staff/${created.id}`).send({ workspaceIds: ['w1'], resourceIds: ['r1', 'r2'] })
    expect(res.body.workspaceResponsibilities).toHaveLength(1)
    expect(res.body.resourceResponsibilities).toHaveLength(2)
    expect(res.body.responsibilitiesCount).toBe(3)
  })

  it('TC-S27 empty id arrays clear previously assigned responsibilities', async () => {
    await freshWorld({ resourceDirectory: true })
    const created = (await api('post', '/staff').send({ accountId: 'ACC-RD2' })).body
    await api('patch', `/staff/${created.id}`).send({ workspaceIds: ['w1'], resourceIds: ['r1'] })
    const res = await api('patch', `/staff/${created.id}`).send({ workspaceIds: [], resourceIds: [] })
    expect(res.body.responsibilitiesCount).toBe(0)
  })
})

describe('BB-STAFF  Archive, delete and summary', () => {
  it('TC-S28 archive hides a member from the default list; unarchive restores', async () => {
    const { id } = (await api('post', '/staff').send({ accountId: 'ACC-A' })).body
    await api('patch', `/staff/${id}`).send({ archived: true })
    expect((await api('get', '/staff')).body).toHaveLength(0)
    expect((await api('get', '/staff?archived=true')).body).toHaveLength(1)
    await api('patch', `/staff/${id}`).send({ archived: false })
    expect((await api('get', '/staff')).body).toHaveLength(1)
  })

  it('TC-S29 delete -> 204, then GET -> 404', async () => {
    const { id } = (await api('post', '/staff').send({ accountId: 'ACC-D' })).body
    const del = await api('delete', `/staff/${id}`)
    expect(del.status).toBe(204)
    expect((await api('get', `/staff/${id}`)).status).toBe(404)
  })

  it('TC-S30 delete unknown id -> 404; delete twice -> 404 the second time', async () => {
    expect((await api('delete', '/staff/ghost')).status).toBe(404)
    const { id } = (await api('post', '/staff').send({ accountId: 'ACC-D2' })).body
    await api('delete', `/staff/${id}`)
    expect((await api('delete', `/staff/${id}`)).status).toBe(404)
  })

  it('TC-S31 cannot delete staff of another business -> 404 and record survives', async () => {
    seedBusiness(fake.prisma, { id: 'biz3' })
    const foreign = seedStaff(fake.prisma, { businessId: 'biz3' })
    const res = await api('delete', `/staff/${foreign.id}`)
    expect(res.status).toBe(404)
    expect(fake.prisma._db.staff.some((s) => s.id === foreign.id)).toBe(true)
  })

  it('TC-S32 summary: totalStaff excludes archived, pendingInvitations counts PENDING', async () => {
    seedStaff(fake.prisma, { status: 'ACTIVE' })
    seedStaff(fake.prisma, { status: 'PENDING' })
    seedStaff(fake.prisma, { status: 'PENDING' })
    seedStaff(fake.prisma, { status: 'ACTIVE', archived: true })
    const res = await api('get', '/summary')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ totalStaff: 3, pendingInvitations: 2 })
  })

  it('TC-S33 summary of an empty business is zeros', async () => {
    expect((await api('get', '/summary')).body).toEqual({ totalStaff: 0, pendingInvitations: 0 })
  })
})

describe('BB-STAFF  Access control', () => {
  it.each([
    ['get', '/summary'], ['get', '/staff'], ['post', '/staff'], ['get', '/staff/x'], ['patch', '/staff/x'], ['delete', '/staff/x'],
  ])('TC-S34 %s %s without token -> 401', async (m, url) => {
    expect((await request(app)[m](`/staff-directory${url}`)).status).toBe(401)
  })

  it('TC-S35 business without the Staff Directory flag -> 403 on every route', async () => {
    const h = bearer('acc2')
    for (const [m, url] of [['get', '/summary'], ['get', '/staff'], ['post', '/staff']]) {
      const res = await request(app)[m](`/staff-directory${url}`).set(h).send({ accountId: 'x' })
      expect(res.status).toBe(403)
    }
  })

  it('TC-S36 second tenant with the flag enabled sees an empty directory (no cross-over)', async () => {
    seedBusiness(fake.prisma, { id: 'biz3' })
    seedAccount(fake.prisma, { id: 'acc3', businessId: 'biz3', email: 'b3@demo.test', passwordHash: 'x' })
    seedStaff(fake.prisma, { businessId: 'biz1', accountId: 'ACC-ONLY-BIZ1' })
    const res = await request(app).get('/staff-directory/staff').set(bearer('acc3'))
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})
