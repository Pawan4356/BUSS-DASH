// Role-based write permissions — authoritative counterpart to
// frontend/src/shared/permissions. Entitlements (entitlements.js) decide
// whether a *business* has a module; this decides which *accounts* inside
// that business may change data in it. Reads stay open to every account of
// the business; writes need OWNER or the module's holder role.

import { FLAGS } from './entitlements.js'

export const MODULE_MANAGER_ROLES = {
  [FLAGS.STAFF_DIRECTORY]: ['OWNER', 'STAFF_MANAGER'],
  [FLAGS.STAFF_RECRUITMENT]: ['OWNER', 'RECRUITMENT_MANAGER'],
  [FLAGS.STAFF_ATTENDANCE]: ['OWNER', 'ATTENDANCE_MANAGER'],
  [FLAGS.RESOURCE_DIRECTORY]: ['OWNER', 'RESOURCE_MANAGER'],
  [FLAGS.OPERATIONAL_SCHEDULING]: ['OWNER', 'OPERATIONS_MANAGER'],
}

export function canManageModule(role, flagKey) {
  return Boolean(MODULE_MANAGER_ROLES[flagKey]?.includes(role))
}
