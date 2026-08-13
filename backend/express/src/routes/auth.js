import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

    const account = await prisma.account.findUnique({
      where: { email },
      include: { business: { include: { flags: true } } },
    })
    if (!account) return res.status(401).json({ message: 'Invalid email or password' })

    const valid = await bcrypt.compare(password, account.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' })

    const token = jwt.sign({ accountId: account.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      account: { id: account.id, email: account.email, role: account.role },
      business: {
        id: account.business.id,
        name: account.business.name,
        recruitmentModelType: account.business.recruitmentModelType,
        verificationLevel: account.business.verificationLevel,
      },
      flags: account.business.flags,
    })
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const business = await prisma.business.findUnique({
      where: { id: req.businessId },
      include: { flags: true },
    })
    res.json({
      account: { id: req.account.id, email: req.account.email, role: req.account.role },
      business: {
        id: business.id,
        name: business.name,
        recruitmentModelType: business.recruitmentModelType,
        verificationLevel: business.verificationLevel,
      },
      flags: business.flags,
    })
  }),
)
