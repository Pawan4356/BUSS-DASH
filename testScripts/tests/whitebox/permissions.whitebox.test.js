/**
 * WHITE-BOX TESTS — role-based write permissions
 * Technique: decision table over (role × module) for canManageModule, branch
 * coverage of requireManagerForWrites, and route-level checks that reads stay
 * open while writes are role-gated.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { buildApp, freshWorld, bearer, fake } from '../helpers/testApp.js'
import { seedAccount, seedStaff } from '../helpers/fakePrisma.js'
import { FLAGS } from '../../../backend/express/src/lib/entitlements.js'
import { MODULE_MANAGER_ROLES, canManageModule } from '../../../backend/express/src/lib/permissions.js'
import { requireManagerForWrites } from '../../../backend/express/src/middleware/requireRole.js'
import { MODULE_MANAGER_ROLES as FRONTEND_ROLES } from '../../../frontend/src/shared/permissions/rolesMap.js'

const ROLES = ['OWNER', 'STAFF_MANAGER', 'RECRUITMENT_MANAGER', 'ATTENDANCE_MANAGER', 'RESOURCE_MANAGER', 'OPERATIONS_MANAGER', 'STAFF']
const HOLDER = {
  [FLAGS.STAFF_DIRECTORY]: 'STAFF_MANAGER',
  [FLAGS.STAFF_RECRUITMENT]: 'RECRUITMENT_MANAGER',
  [FLAGS.STAFF_ATTENDANCE]: 'ATTENDANCE_MANAGER',
  [FLAGS.RESOURCE_DIRECTORY]: 'RESOURCE_MANAGER',
  [FLAGS.OPERATIONAL_SCHEDULING]: 'OPERATIONS_MANAGER',
}

const mockRes = () => {
  const res = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('WB-PERM  canManageModule — decision table', () => {
  for (const [module, holder] of Object.entries(HOLDER)) {
    for (const role of ROLES) {
      const expected = role === 'OWNER' || role === holder
      it(`${role} on ${module} -> ${expected}`, () => {
        expect(canManageModule(role, module)).toBe(expected)
      })
    }
  }

  it('unknown module or missing role -> false', () => {
    expect(canManageModule('OWNER', 'nope')).toBe(false)
    expect(canManageModule(undefined, FLAGS.STAFF_DIRECTORY)).toBe(false)
  })

  it('frontend copy matches the backend copy', () => {
    expect(FRONTEND_ROLES).toEqual(MODULE_MANAGER_ROLES)
  })
})

describe('WB-PERM  requireManagerForWrites — every branch', () => {
  const mw = requireManagerForWrites(FLAGS.STAFF_DIRECTORY)

  it('B1 read method passes for any role', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const next = vi.fn()
      mw({ method, account: { role: 'STAFF' } }, mockRes(), next)
      expect(next).toHaveBeenCalledOnce()
    }
  })

  it('B2 write by a manager role passes', () => {
    const next = vi.fn()
    mw({ method: 'DELETE', account: { role: 'STAFF_MANAGER' } }, mockRes(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('B3 write by another role -> 403 insufficient-role, next NOT called', () => {
    const res = mockRes(); const next = vi.fn()
    mw({ method: 'POST', account: { role: 'ATTENDANCE_MANAGER' } }, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ reason: 'insufficient-role' }))
    expect(next).not.toHaveBeenCalled()
  })
})

describe('WB-PERM  routes — reads open, writes gated', () => {
  let app
  let staff
  beforeEach(async () => {
    await freshWorld()
    app = await buildApp()
    for (const role of ROLES.filter((r) => r !== 'OWNER')) {
      seedAccount(fake.prisma, { id: `acc-${role}`, businessId: 'biz1', email: `${role}@demo.test`, passwordHash: 'x', role })
    }
    staff = seedStaff(fake.prisma, { firstName: 'Target' })
  })

  it('STAFF can still read the directory and attendance register', async () => {
    expect((await request(app).get('/staff-directory/staff').set(bearer('acc-STAFF'))).status).toBe(200)
    expect((await request(app).get('/staff-attendance/register?date=2026-09-22').set(bearer('acc-STAFF'))).status).toBe(200)
  })

  it('STAFF cannot invite, edit or delete staff', async () => {
    const as = bearer('acc-STAFF')
    expect((await request(app).post('/staff-directory/staff').set(as).send({ accountId: 'X' })).status).toBe(403)
    expect((await request(app).patch(`/staff-directory/staff/${staff.id}`).set(as).send({ firstName: 'Hacked' })).status).toBe(403)
    expect((await request(app).delete(`/staff-directory/staff/${staff.id}`).set(as)).status).toBe(403)
  })

  it('a manager of another module cannot edit the directory', async () => {
    const res = await request(app).delete(`/staff-directory/staff/${staff.id}`).set(bearer('acc-ATTENDANCE_MANAGER'))
    expect(res.status).toBe(403)
  })

  it('STAFF_MANAGER can delete staff; ATTENDANCE_MANAGER can mark attendance', async () => {
    const del = await request(app).delete(`/staff-directory/staff/${staff.id}`).set(bearer('acc-STAFF_MANAGER'))
    expect(del.status).toBe(204)
    const other = seedStaff(fake.prisma, { firstName: 'Other' })
    const mark = await request(app)
      .patch(`/staff-attendance/register/${other.id}?date=2026-09-22`)
      .set(bearer('acc-ATTENDANCE_MANAGER'))
      .send({ status: 'ABSENT' })
    expect(mark.status).toBe(200)
  })

  it('STAFF_MANAGER cannot mark attendance', async () => {
    const res = await request(app)
      .patch(`/staff-attendance/register/${staff.id}?date=2026-09-22`)
      .set(bearer('acc-STAFF_MANAGER'))
      .send({ status: 'ABSENT' })
    expect(res.status).toBe(403)
  })
})
