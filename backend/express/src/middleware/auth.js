import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Missing bearer token' })

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }

  const account = await prisma.account.findUnique({ where: { id: payload.accountId } })
  if (!account) return res.status(401).json({ message: 'Account no longer exists' })

  req.account = account
  req.businessId = account.businessId
  next()
})
