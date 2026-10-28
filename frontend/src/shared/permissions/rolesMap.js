// Role-based write permissions — mirrors backend/express/src/lib/permissions.js
// (a white-box test checks the two agree). Kept free of React/Redux imports
// so the parity test can load it in Node.
import { FLAGS } from '../flags'

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
