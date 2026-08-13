// Entitlement-flag gating logic — mirrors backend/express/src/lib/entitlements.js.
// Kept in one place so the sidebar, route guards, and conditional module
// sections never disagree on who can see what. See spec §3.

export const FLAGS = {
  STAFF_DIRECTORY: 'staffDirectory',
  STAFF_RECRUITMENT: 'staffRecruitment',
  STAFF_ATTENDANCE: 'staffAttendance',
  RESOURCE_DIRECTORY: 'resourceDirectory',
  OPERATIONAL_SCHEDULING: 'operationalScheduling',
  OPERATIONAL_SCHEDULING_PREMIUM: 'operationalSchedulingPremium',
}

export const MODULES = [
  { key: FLAGS.STAFF_DIRECTORY, label: 'Staff Directory', path: '/staff-directory' },
  { key: FLAGS.STAFF_RECRUITMENT, label: 'Staff Recruitment', path: '/staff-recruitment' },
  { key: FLAGS.STAFF_ATTENDANCE, label: 'Staff Attendance', path: '/staff-attendance' },
  { key: FLAGS.RESOURCE_DIRECTORY, label: 'Resource Directory', path: '/resource-directory' },
  { key: FLAGS.OPERATIONAL_SCHEDULING, label: 'Operational Scheduling', path: '/operational-scheduling' },
]

/**
 * Resolves whether a module is reachable right now, plus *why not* when it
 * isn't — the UI uses the reason to redirect (e.g. to enhanced-verification)
 * instead of just hiding the nav item silently.
 */
export function resolveModuleAccess(flagKey, { flags, business }) {
  if (!flags) return { allowed: false, reason: 'not-purchased' }

  switch (flagKey) {
    case FLAGS.STAFF_DIRECTORY:
    case FLAGS.STAFF_ATTENDANCE:
      return flags[flagKey]
        ? { allowed: true }
        : { allowed: false, reason: 'not-purchased' }

    case FLAGS.RESOURCE_DIRECTORY:
      return flags.resourceDirectory
        ? { allowed: true }
        : { allowed: false, reason: 'not-purchased' }

    case FLAGS.OPERATIONAL_SCHEDULING: {
      if (!flags.operationalScheduling) return { allowed: false, reason: 'not-purchased' }
      if (!flags.staffDirectory || !flags.resourceDirectory) {
        return { allowed: false, reason: 'requires-staff-and-resource-directory' }
      }
      return { allowed: true }
    }

    case FLAGS.OPERATIONAL_SCHEDULING_PREMIUM: {
      const base = resolveModuleAccess(FLAGS.OPERATIONAL_SCHEDULING, { flags, business })
      if (!base.allowed) return base
      return flags.operationalSchedulingPremium
        ? { allowed: true }
        : { allowed: false, reason: 'not-purchased' }
    }

    case FLAGS.STAFF_RECRUITMENT: {
      if (!flags.staffRecruitment) return { allowed: false, reason: 'not-purchased' }
      const model = business?.recruitmentModelType
      const verification = business?.verificationLevel
      if (model === 'B2C' || model === 'BOTH') {
        return verification === 'ENHANCED'
          ? { allowed: true }
          : { allowed: false, reason: 'requires-enhanced-verification' }
      }
      // INTERNAL
      return verification === 'BASIC' || verification === 'ENHANCED'
        ? { allowed: true }
        : { allowed: false, reason: 'requires-enhanced-verification' }
    }

    default:
      return { allowed: false, reason: 'unknown-module' }
  }
}

export function accessibleModules({ flags, business }) {
  return MODULES.map((m) => ({ ...m, access: resolveModuleAccess(m.key, { flags, business }) }))
}
