import { canManageModule } from '../lib/permissions.js'

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Must run after requireAuth. Lets reads through for any account of the
 * business; any write (POST/PATCH/PUT/DELETE) needs a role that manages the
 * module, otherwise 403 { reason: 'insufficient-role' }.
 */
export function requireManagerForWrites(flagKey) {
  return (req, res, next) => {
    if (READ_METHODS.has(req.method) || canManageModule(req.account.role, flagKey)) return next()
    return res.status(403).json({
      message: 'Your role does not allow changes in this module.',
      reason: 'insufficient-role',
    })
  }
}
