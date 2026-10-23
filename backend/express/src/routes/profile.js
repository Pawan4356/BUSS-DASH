import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { pickProfileUpdate, serializeProfile } from '../lib/profileHelpers.js'

const MIN_PASSWORD_LENGTH = 8

export const profileRouter = Router()
profileRouter.use(requireAuth)

profileRouter.get('/', (req, res) => {
  res.json(serializeProfile(req.account))
})

profileRouter.patch(
  '/',
  asyncHandler(async (req, res) => {
    const { data, error } = pickProfileUpdate(req.body ?? {})
    if (error) return res.status(400).json({ message: error })

    const account = await prisma.account.update({ where: { id: req.account.id }, data })
    res.json(serializeProfile(account))
  }),
)

profileRouter.post(
  '/password',
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {}
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' })
    }
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` })
    }

    const valid = await bcrypt.compare(currentPassword, req.account.passwordHash)
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' })

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.account.update({ where: { id: req.account.id }, data: { passwordHash } })
    res.status(204).end()
  }),
)
