// Server-side entitlement resolution — authoritative counterpart to
// frontend/src/shared/flags. The frontend copy is for UX (hide/redirect
// before a round-trip); this one is what actually gates the API.

export const FLAGS = {
  STAFF_DIRECTORY: 'staffDirectory',
  STAFF_RECRUITMENT: 'staffRecruitment',
  STAFF_ATTENDANCE: 'staffAttendance',
  RESOURCE_DIRECTORY: 'resourceDirectory',
  OPERATIONAL_SCHEDULING: 'operationalScheduling',
  OPERATIONAL_SCHEDULING_PREMIUM: 'operationalSchedulingPremium',
}

export function resolveModuleAccess(flagKey, { flags, business }) {
  if (!flags) return { allowed: false, reason: 'not-purchased' }

  switch (flagKey) {
    case FLAGS.STAFF_DIRECTORY:
    case FLAGS.STAFF_ATTENDANCE:
    case FLAGS.RESOURCE_DIRECTORY:
      return flags[flagKey] ? { allowed: true } : { allowed: false, reason: 'not-purchased' }

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
      return flags.operationalSchedulingPremium ? { allowed: true } : { allowed: false, reason: 'not-purchased' }
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
      return verification === 'BASIC' || verification === 'ENHANCED'
        ? { allowed: true }
        : { allowed: false, reason: 'requires-enhanced-verification' }
    }

    default:
      return { allowed: false, reason: 'unknown-module' }
  }
}
