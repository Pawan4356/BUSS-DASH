import { prisma } from '../lib/prisma.js'
import { resolveModuleAccess } from '../lib/entitlements.js'
import { asyncHandler } from '../lib/asyncHandler.js'

const REASON_MESSAGES = {
  'not-purchased': 'This module is not part of your current plan.',
  'requires-staff-and-resource-directory':
    'Operational Scheduling requires both Staff Directory and Resource Directory.',
  'requires-enhanced-verification': 'This action requires enhanced business verification.',
}

/** Must run after requireAuth. Loads business + flags and 403s with a reason if gated. */
export function requireFlag(flagKey) {
  return asyncHandler(async (req, res, next) => {
    const business = await prisma.business.findUnique({
      where: { id: req.businessId },
      include: { flags: true },
    })
    if (!business) return res.status(404).json({ message: 'Business not found' })

    const access = resolveModuleAccess(flagKey, { flags: business.flags, business })
    if (!access.allowed) {
      return res.status(403).json({
        message: REASON_MESSAGES[access.reason] ?? 'Access denied',
        reason: access.reason,
      })
    }

    req.business = business
    req.flags = business.flags
    next()
  })
}
