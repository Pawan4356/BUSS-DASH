/**
 * BLACK-BOX TESTS — Module 1: Authentication & Entitlement Management
 * Techniques: Equivalence Partitioning (EP), Boundary Value Analysis (BVA),
 *             Decision Table testing, Error guessing.
 * Only the public HTTP contract is used (request in -> response out).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { buildApp, freshWorld, tokenFor, bearer, PASSWORD, fake } from '../helpers/testApp.js'
import { seedBusiness, seedAccount } from '../helpers/fakePrisma.js'

let app
beforeEach(async () => {
  await freshWorld()
  app = await buildApp()
})

describe('BB-AUTH  POST /auth/login', () => {
  it('TC-A01 valid credentials -> 200 with token, account, business, flags', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'owner@demo.test', password: PASSWORD })
    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.account).toEqual({ id: 'acc1', email: 'owner@demo.test', role: 'OWNER' })
    expect(res.body.business).toMatchObject({ id: 'biz1', verificationLevel: 'BASIC', recruitmentModelType: 'INTERNAL' })
    expect(res.body.flags).toMatchObject({ staffDirectory: true, staffAttendance: true })
  })

  it('TC-A02 response never leaks the password hash', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'owner@demo.test', password: PASSWORD })
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/)
  })

  it('TC-A03 correct email + wrong password -> 401', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'owner@demo.test', password: 'wrong' })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  it('TC-A04 unknown email -> 401 with the SAME message (no user enumeration)', async () => {
    const wrongPw = await request(app).post('/auth/login').send({ email: 'owner@demo.test', password: 'wrong' })
    const noUser = await request(app).post('/auth/login').send({ email: 'ghost@demo.test', password: PASSWORD })
    expect(noUser.status).toBe(401)
    expect(noUser.body.message).toBe(wrongPw.body.message)
  })

  // EP: invalid-input partitions -> 400
  it.each([
    ['empty body', {}],
    ['missing password', { email: 'owner@demo.test' }],
    ['missing email', { password: PASSWORD }],
    ['empty-string email', { email: '', password: PASSWORD }],
    ['empty-string password', { email: 'owner@demo.test', password: '' }],
  ])('TC-A05 %s -> 400', async (_label, body) => {
    const res = await request(app).post('/auth/login').send(body)
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Email and password are required')
  })

  it('TC-A06 password is case-sensitive', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'owner@demo.test', password: PASSWORD.toUpperCase() })
    expect(res.status).toBe(401)
  })

  it('TC-A07 SQL-injection style input is treated as plain data -> 401', async () => {
    const res = await request(app).post('/auth/login').send({ email: "' OR '1'='1", password: "' OR '1'='1" })
    expect(res.status).toBe(401)
  })

  it('TC-A08 token issued at login is accepted by a protected endpoint', async () => {
    const login = await request(app).post('/auth/login').send({ email: 'owner@demo.test', password: PASSWORD })
    const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${login.body.token}`)
    expect(me.status).toBe(200)
  })
})

describe('BB-AUTH  GET /auth/me  (session / token validation)', () => {
  it('TC-A09 valid token -> 200 with account, business and flags', async () => {
    const res = await request(app).get('/auth/me').set(bearer('acc1'))
    expect(res.status).toBe(200)
    expect(res.body.account.email).toBe('owner@demo.test')
    expect(res.body.business.id).toBe('biz1')
    expect(res.body.flags.staffDirectory).toBe(true)
  })

  it.each([
    ['no Authorization header', undefined],
    ['wrong scheme (Basic)', 'Basic abc123'],
    ['Bearer with no token', 'Bearer '],
    ['garbage token', 'Bearer not.a.jwt'],
    ['token signed with another secret', `Bearer ${tokenFor('acc1', { secret: 'attacker' })}`],
  ])('TC-A10 %s -> 401', async (_l, header) => {
    const req = request(app).get('/auth/me')
    if (header) req.set('Authorization', header)
    const res = await req
    expect(res.status).toBe(401)
  })

  it('TC-A11 expired token -> 401 "Invalid or expired token"', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${tokenFor('acc1', { expiresIn: -10 })}`)
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid or expired token')
  })

  it('TC-A12 valid token for an account that no longer exists -> 401', async () => {
    const res = await request(app).get('/auth/me').set(bearer('acc-deleted'))
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Account no longer exists')
  })

  it('TC-A13 "logout" = client discards token; without a token access is refused', async () => {
    // Logout is implemented client-side (frontend authSlice.loggedOut removes the
    // token). The observable server behaviour: a request with no token is rejected.
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })
})

// ───────── Decision table: entitlement flags -> module access ─────────
describe('BB-ENTITLEMENT  Decision table (flag combination -> HTTP access)', () => {
  // [staffDirectory, staffAttendance] -> [dir status, attendance status]
  const table = [
    [true, true, 200, 200],
    [true, false, 200, 403],
    [false, true, 403, 200],
    [false, false, 403, 403],
  ]
  it.each(table)('TC-E0x directory=%s attendance=%s -> dir %i / attendance %i', async (dir, att, dirCode, attCode) => {
    await freshWorld({ staffDirectory: dir, staffAttendance: att })
    const d = await request(app).get('/staff-directory/summary').set(bearer('acc1'))
    const a = await request(app).get('/staff-attendance/summary').set(bearer('acc1'))
    expect(d.status).toBe(dirCode)
    expect(a.status).toBe(attCode)
  })

  it('TC-E05 blocked module returns reason "not-purchased" and a readable message', async () => {
    const res = await request(app).get('/staff-directory/summary').set(bearer('acc2')) // biz2: everything off
    expect(res.status).toBe(403)
    expect(res.body.reason).toBe('not-purchased')
    expect(res.body.message).toBe('This module is not part of your current plan.')
  })

  it('TC-E06 business with no flags row at all -> 403', async () => {
    seedBusiness(fake.prisma, { id: 'biz3', flags: null })
    seedAccount(fake.prisma, { id: 'acc3', businessId: 'biz3', email: 'noflags@demo.test', passwordHash: 'x' })
    const res = await request(app).get('/staff-attendance/summary').set(bearer('acc3'))
    expect(res.status).toBe(403)
  })

  it('TC-E07 unauthenticated request to a gated module -> 401 (auth is checked before entitlement)', async () => {
    const res = await request(app).get('/staff-directory/summary')
    expect(res.status).toBe(401)
  })

  it('TC-E08 enabling a flag takes effect on the next request (no re-login needed)', async () => {
    const before = await request(app).get('/staff-directory/summary').set(bearer('acc2'))
    expect(before.status).toBe(403)
    fake.prisma._db.business.find((b) => b.id === 'biz2').flags.staffDirectory = true
    const after = await request(app).get('/staff-directory/summary').set(bearer('acc2'))
    expect(after.status).toBe(200)
  })
})
