/**
 * WHITE-BOX TESTS — middleware + asyncHandler (unit level, req/res stubbed)
 * Technique: statement + branch coverage of requireAuth / requireFlag / asyncHandler.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { fake, tokenFor } from '../helpers/testApp.js'
import { createFakePrisma, seedBusiness, seedAccount } from '../helpers/fakePrisma.js'
import { requireAuth } from '../../src/middleware/auth.js'
import { requireFlag } from '../../src/middleware/requireFlag.js'
import { asyncHandler } from '../../src/lib/asyncHandler.js'

const mockRes = () => {
  const res = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

beforeEach(() => {
  fake.prisma = createFakePrisma()
  seedBusiness(fake.prisma, { id: 'biz1' })
  seedAccount(fake.prisma, { id: 'acc1', businessId: 'biz1', email: 'a@b.c', passwordHash: 'x' })
})

describe('WB-MW  requireAuth — every branch', () => {
  it('B1 no Authorization header -> 401 "Missing bearer token", next NOT called', async () => {
    const res = mockRes(); const next = vi.fn()
    await requireAuth({ headers: {} }, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing bearer token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('B2 header present but not "Bearer " prefix -> treated as missing', async () => {
    const res = mockRes(); const next = vi.fn()
    await requireAuth({ headers: { authorization: 'Token abc' } }, res, next)
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing bearer token' })
  })

  it('B3 jwt.verify throws -> 401 "Invalid or expired token"', async () => {
    const res = mockRes(); const next = vi.fn()
    await requireAuth({ headers: { authorization: 'Bearer junk' } }, res, next)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('B4 valid JWT but account row missing -> 401 "Account no longer exists"', async () => {
    const res = mockRes(); const next = vi.fn()
    await requireAuth({ headers: { authorization: `Bearer ${tokenFor('ghost')}` } }, res, next)
    expect(res.json).toHaveBeenCalledWith({ message: 'Account no longer exists' })
    expect(next).not.toHaveBeenCalled()
  })

  it('B5 success -> req.account + req.businessId populated, next() called once with no args', async () => {
    const req = { headers: { authorization: `Bearer ${tokenFor('acc1')}` } }
    const res = mockRes(); const next = vi.fn()
    await requireAuth(req, res, next)
    expect(req.account.id).toBe('acc1')
    expect(req.businessId).toBe('biz1')
    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
  })

  it('B6 the JWT payload carries only accountId (no role / flags baked into the token)', () => {
    const decoded = jwt.decode(tokenFor('acc1'))
    expect(Object.keys(decoded).sort()).toEqual(['accountId', 'exp', 'iat'])
  })

  it('B7 a database failure is forwarded to Express error middleware via next(err)', async () => {
    fake.prisma.account.findUnique = async () => { throw new Error('db down') }
    const next = vi.fn()
    await requireAuth({ headers: { authorization: `Bearer ${tokenFor('acc1')}` } }, mockRes(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'db down' }))
  })
})

describe('WB-MW  requireFlag — every branch', () => {
  const run = async (flagKey, req) => {
    const res = mockRes(); const next = vi.fn()
    await requireFlag(flagKey)(req, res, next)
    return { res, next }
  }

  it('B1 business not found -> 404', async () => {
    const { res, next } = await run('staffDirectory', { businessId: 'nope' })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Business not found' })
    expect(next).not.toHaveBeenCalled()
  })

  it('B2 flag denied with a known reason -> 403 + mapped message + reason', async () => {
    fake.prisma._db.business[0].flags.staffDirectory = false
    const { res } = await run('staffDirectory', { businessId: 'biz1' })
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'This module is not part of your current plan.', reason: 'not-purchased' })
  })

  it.each([
    ['operationalScheduling', { operationalScheduling: true, staffDirectory: true, resourceDirectory: false }, 'Operational Scheduling requires both Staff Directory and Resource Directory.'],
    ['staffRecruitment', { staffRecruitment: true }, 'This action requires enhanced business verification.'],
  ])('B3 %s -> reason-specific message', async (key, flagPatch, message) => {
    Object.assign(fake.prisma._db.business[0].flags, flagPatch)
    if (key === 'staffRecruitment') {
      fake.prisma._db.business[0].verificationLevel = 'BASIC'
      fake.prisma._db.business[0].recruitmentModelType = 'B2C'
    }
    const { res } = await run(key, { businessId: 'biz1' })
    expect(res.json.mock.calls[0][0].message).toBe(message)
  })

  it('B4 unknown reason falls back to the generic "Access denied" message', async () => {
    const { res } = await run('not-a-real-module', { businessId: 'biz1' })
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'Access denied', reason: 'unknown-module' })
  })

  it('B5 allowed -> req.business & req.flags attached, next() called', async () => {
    const req = { businessId: 'biz1' }
    const { next } = await run('staffDirectory', req)
    expect(req.business.id).toBe('biz1')
    expect(req.flags.staffDirectory).toBe(true)
    expect(next).toHaveBeenCalledWith()
  })
})

describe('WB-MW  asyncHandler', () => {
  it('resolves normally -> next not called', async () => {
    const next = vi.fn()
    await asyncHandler(async () => 'ok')({}, {}, next)
    expect(next).not.toHaveBeenCalled()
  })
  it('rejection is passed to next(err)', async () => {
    const err = new Error('boom'); const next = vi.fn()
    await asyncHandler(async () => { throw err })({}, {}, next)
    expect(next).toHaveBeenCalledWith(err)
  })
})
