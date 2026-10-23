/**
 * BLACK-BOX TESTS — Account Profile (GET/PATCH /profile, POST /profile/password)
 * Techniques: EP (valid / invalid field types, avatar formats), BVA (field length
 *             120 / 121, password length 7 / 8), State-based (password change ->
 *             old password stops working), Security (hash never returned,
 *             protected fields ignored, tenant-agnostic: own account only).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { buildApp, freshWorld, bearer, PASSWORD, fake } from '../helpers/testApp.js'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

let app
const get = (acc = 'acc1') => request(app).get('/profile').set(bearer(acc))
const patch = (body, acc = 'acc1') => request(app).patch('/profile').set(bearer(acc)).send(body)
const changePw = (body, acc = 'acc1') => request(app).post('/profile/password').set(bearer(acc)).send(body)
const account = (id = 'acc1') => fake.prisma._db.account.find((a) => a.id === id)

beforeEach(async () => {
  await freshWorld()
  app = await buildApp()
})

describe('BB-PROFILE  View  GET /profile', () => {
  it('TC-P01 empty profile -> 200, every field null, memberSince from createdAt', async () => {
    const res = await get()
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      firstName: null, lastName: null, displayName: null, jobTitle: null, department: null,
      phone: null, location: null, timezone: null, avatar: null, memberSince: '2026-01-01T00:00:00.000Z',
    })
  })

  it('TC-P02 displayName joins first + last name', async () => {
    Object.assign(account(), { firstName: 'Kavita', lastName: 'Raman' })
    expect((await get()).body.displayName).toBe('Kavita Raman')
  })

  it('TC-P03 never exposes passwordHash, email, role or businessId', async () => {
    const res = await get()
    expect(Object.keys(res.body)).not.toEqual(expect.arrayContaining(['passwordHash']))
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$|biz1|owner@demo\.test/)
  })

  it('TC-P04 without a token -> 401 on every profile route', async () => {
    expect((await request(app).get('/profile')).status).toBe(401)
    expect((await request(app).patch('/profile').send({ firstName: 'X' })).status).toBe(401)
    expect((await request(app).post('/profile/password').send({})).status).toBe(401)
  })

  it('TC-P05 profile is not module-gated: a business with every flag off can still use it', async () => {
    const res = await get('acc2') // biz2: all modules off
    expect(res.status).toBe(200)
  })
})

describe('BB-PROFILE  Update  PATCH /profile', () => {
  it('TC-P06 update every text field -> 200 and persisted', async () => {
    const body = {
      firstName: 'Kavita', lastName: 'Raman', jobTitle: 'Medical Director', department: 'Clinical',
      phone: '+91 98200 11111', location: 'Mumbai', timezone: 'Asia/Kolkata',
    }
    const res = await patch(body)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ...body, displayName: 'Kavita Raman' })
    expect(account()).toMatchObject(body)
  })

  it('TC-P07 partial update leaves other fields untouched', async () => {
    await patch({ firstName: 'Kavita', jobTitle: 'Director' })
    const res = await patch({ jobTitle: 'Medical Director' })
    expect(res.body).toMatchObject({ firstName: 'Kavita', jobTitle: 'Medical Director' })
  })

  it('TC-P08 values are trimmed; empty / whitespace-only strings clear the field', async () => {
    await patch({ firstName: 'Kavita', phone: '123' })
    const res = await patch({ firstName: '  Kav  ', phone: '   ' })
    expect(res.body.firstName).toBe('Kav')
    expect(res.body.phone).toBeNull()
  })

  it('TC-P09 explicit null clears a field', async () => {
    await patch({ location: 'Pune' })
    expect((await patch({ location: null })).body.location).toBeNull()
  })

  it.each([
    ['120 characters (upper boundary) -> 200', 120, 200],
    ['121 characters (just over) -> 400', 121, 400],
  ])('TC-P10 BVA jobTitle of %s', async (_l, len, code) => {
    const res = await patch({ jobTitle: 'x'.repeat(len) })
    expect(res.status).toBe(code)
    if (code === 400) expect(res.body.message).toBe('jobTitle is too long')
  })

  it.each([
    ['number', 42],
    ['boolean', true],
    ['object', { a: 1 }],
    ['array', ['a']],
  ])('TC-P11 non-string value (%s) -> 400 and nothing saved', async (_l, value) => {
    const res = await patch({ firstName: 'Kavita', lastName: value })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('lastName must be a string')
    expect(account().firstName).toBeNull() // whole update rejected, not partially applied
  })

  it('TC-P12 protected / unknown fields are ignored (email, role, passwordHash, businessId)', async () => {
    const before = { ...account() }
    const res = await patch({ email: 'hacker@x.test', role: 'STAFF', passwordHash: 'x', businessId: 'biz2', foo: 1 })
    expect(res.status).toBe(200)
    expect(account()).toMatchObject({
      email: before.email, role: before.role, passwordHash: before.passwordHash, businessId: before.businessId,
    })
    expect(account()).not.toHaveProperty('foo')
  })

  it('TC-P13 empty body is a no-op -> 200', async () => {
    const res = await patch({})
    expect(res.status).toBe(200)
    expect(res.body.firstName).toBeNull()
  })

  it('TC-P14 an account only ever edits its own profile', async () => {
    await patch({ firstName: 'Mine' }, 'acc1')
    expect(account('acc2').firstName).toBeNull()
  })
})

describe('BB-PROFILE  Avatar  PATCH /profile { avatar }', () => {
  it.each([
    ['built-in person preset', 'preset:person-coral'],
    ['built-in fun preset', 'preset:gorilla'],
    ['uploaded PNG data URL', PNG],
    ['uploaded JPEG data URL', 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
    ['uploaded WebP data URL', 'data:image/webp;base64,UklGRhIAAABXRUJQ'],
    ['null (back to initials)', null],
  ])('TC-P15 valid avatar: %s -> 200', async (_l, avatar) => {
    const res = await patch({ avatar })
    expect(res.status).toBe(200)
    expect(res.body.avatar).toBe(avatar)
  })

  it.each([
    ['unknown preset key', 'preset:dragon'],
    ['preset key without the prefix', 'person-coral'],
    ['SVG data URL (script vector)', 'data:image/svg+xml;base64,PHN2Zz4='],
    ['GIF data URL', 'data:image/gif;base64,R0lGODlh'],
    ['remote URL', 'https://example.com/me.png'],
    ['data URL with non-base64 characters', 'data:image/png;base64,<script>'],
    ['number', 7],
  ])('TC-P16 invalid avatar: %s -> 400', async (_l, avatar) => {
    const res = await patch({ avatar })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/^Avatar must be/)
  })

  it('TC-P17 BVA avatar size: 500 000 characters accepted, 500 001 rejected', async () => {
    const prefix = 'data:image/png;base64,'
    const ok = prefix + 'A'.repeat(500_000 - prefix.length)
    const tooBig = prefix + 'A'.repeat(500_001 - prefix.length)
    expect((await patch({ avatar: ok })).status).toBe(200)
    expect((await patch({ avatar: tooBig })).status).toBe(400)
  })

  it('TC-P18 avatar change is reflected in the login response', async () => {
    await patch({ avatar: 'preset:person-sage' })
    const login = await request(app).post('/auth/login').send({ email: 'owner@demo.test', password: PASSWORD })
    expect(login.body.profile.avatar).toBe('preset:person-sage')
  })
})

describe('BB-PROFILE  Change password  POST /profile/password', () => {
  const NEW = 'brand-new-pass'

  it('TC-P19 correct current password -> 204; new password works, old one does not', async () => {
    const res = await changePw({ currentPassword: PASSWORD, newPassword: NEW })
    expect(res.status).toBe(204)
    const oldLogin = await request(app).post('/auth/login').send({ email: 'owner@demo.test', password: PASSWORD })
    const newLogin = await request(app).post('/auth/login').send({ email: 'owner@demo.test', password: NEW })
    expect(oldLogin.status).toBe(401)
    expect(newLogin.status).toBe(200)
  })

  it('TC-P20 new password is stored hashed, never in plain text', async () => {
    await changePw({ currentPassword: PASSWORD, newPassword: NEW })
    expect(account().passwordHash).not.toBe(NEW)
    expect(account().passwordHash).toMatch(/^\$2[aby]\$/)
  })

  it('TC-P21 wrong current password -> 400 and password unchanged', async () => {
    const before = account().passwordHash
    const res = await changePw({ currentPassword: 'wrong-one', newPassword: NEW })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Current password is incorrect')
    expect(account().passwordHash).toBe(before)
  })

  it.each([
    ['empty body', {}],
    ['missing currentPassword', { newPassword: NEW }],
    ['missing newPassword', { currentPassword: PASSWORD }],
    ['empty-string newPassword', { currentPassword: PASSWORD, newPassword: '' }],
  ])('TC-P22 %s -> 400 "required"', async (_l, body) => {
    const res = await changePw(body)
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Current and new password are required')
  })

  it.each([
    ['7 characters (just under) -> 400', 'x'.repeat(7), 400],
    ['8 characters (boundary) -> 204', 'x'.repeat(8), 204],
  ])('TC-P23 BVA new password of %s', async (_l, newPassword, code) => {
    const res = await changePw({ currentPassword: PASSWORD, newPassword })
    expect(res.status).toBe(code)
    if (code === 400) expect(res.body.message).toBe('New password must be at least 8 characters')
  })

  it('TC-P24 non-string newPassword (number) -> 400', async () => {
    const res = await changePw({ currentPassword: PASSWORD, newPassword: 12345678 })
    expect(res.status).toBe(400)
  })
})
