// Builds the same Express app as src/index.js (minus listen()) wired to a
// fake Prisma client, so routers/middleware run unmodified.
import { vi } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import express from 'express'
import { createFakePrisma, seedBusiness, seedAccount } from './fakePrisma.js'

export const fake = { prisma: null }

// Hoisted by vitest: every `../lib/prisma.js` import resolves to the fake.
vi.mock('../../src/lib/prisma.js', () => ({
  get prisma() {
    return fake.prisma
  },
}))

export async function buildApp() {
  const { authRouter } = await import('../../src/routes/auth.js')
  const { staffDirectoryRouter } = await import('../../src/routes/staffDirectory.js')
  const { staffAttendanceRouter } = await import('../../src/routes/staffAttendance.js')

  const app = express()
  app.use(express.json())
  app.use('/auth', authRouter)
  app.use('/staff-directory', staffDirectoryRouter)
  app.use('/staff-attendance', staffAttendanceRouter)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(err.status ?? 500).json({ message: err.message ?? 'Internal server error' }))
  return app
}

export const PASSWORD = 'password123'

/** Fresh DB with: biz1 (dir+attendance ON), owner@demo.test; biz2 (everything OFF), other@demo.test */
export async function freshWorld(flagOverrides = {}) {
  fake.prisma = createFakePrisma()
  const hash = await bcrypt.hash(PASSWORD, 4)
  seedBusiness(fake.prisma, { id: 'biz1', flags: flagOverrides })
  seedAccount(fake.prisma, { id: 'acc1', businessId: 'biz1', email: 'owner@demo.test', passwordHash: hash, role: 'OWNER' })
  seedBusiness(fake.prisma, {
    id: 'biz2',
    flags: { staffDirectory: false, staffAttendance: false },
  })
  seedAccount(fake.prisma, { id: 'acc2', businessId: 'biz2', email: 'other@demo.test', passwordHash: hash, role: 'OWNER' })
  return fake.prisma
}

export const tokenFor = (accountId, opts = {}) =>
  jwt.sign({ accountId }, opts.secret ?? process.env.JWT_SECRET, { expiresIn: opts.expiresIn ?? '1h' })

export const bearer = (accountId) => ({ Authorization: `Bearer ${tokenFor(accountId)}` })
