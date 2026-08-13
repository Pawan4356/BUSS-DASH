import { useSelector } from 'react-redux'
import { resolveModuleAccess } from '../shared/flags'
import { EmptyState } from '../shared/components'

const REASON_COPY = {
  'not-purchased': 'This module isn’t part of your current plan yet.',
  'requires-staff-and-resource-directory':
    'Operational Scheduling needs both Staff Directory and Resource Directory to be purchased.',
  'requires-enhanced-verification':
    'This recruitment mode requires enhanced business verification before it can be used.',
}

/** Route guard for a flag-gated module — shows why access is blocked instead of a blank page. */
export function RequireModule({ flagKey, children }) {
  const flags = useSelector((s) => s.auth.flags)
  const business = useSelector((s) => s.auth.business)
  const access = resolveModuleAccess(flagKey, { flags, business })

  if (!access.allowed) {
    return (
      <EmptyState
        title="Module unavailable"
        description={REASON_COPY[access.reason] ?? 'You don’t have access to this module.'}
      />
    )
  }
  return children
}
