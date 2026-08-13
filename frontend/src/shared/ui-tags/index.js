// Single source of truth for every label/tag shown across modules.
// The raw spec used inconsistent casing per module (businss_status,
// oprational_status, sheduling, ...) — every module should import
// labels from here instead of hardcoding strings. See docs/decisions.md #1.

export const FIELD_LABELS = {
  STATUS: 'Status',
  BUSINESS_STATUS: 'Business Status',
  OPERATIONAL_STATUS: 'Operational Status',
  EMPLOYMENT_TYPE: 'Employment Type',
  RESPONSIBLE_PERSON: 'Responsible Person',
  RESPONSIBILITIES_COUNT: 'Responsibilities',
  WORKING_SCHEDULE: 'Working Schedule',
  SCHEDULING_ACCESS: 'Scheduling Access',
  RECRUITMENT_AUDIENCE: 'Recruitment Audience',
  VERIFICATION_LEVEL: 'Verification Level',
}

export const STAFF_STATUS = {
  PENDING: 'Pending Invitation',
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  SUSPENDED: 'Suspended',
  RESIGNED: 'Resigned',
}

export const EMPLOYMENT_TYPE_PRESETS = [
  'Full-Time',
  'Part-Time',
  'Intern',
  'Contract',
  'Visiting Consultant',
]

export const BUSINESS_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  MAINTENANCE: 'Maintenance',
}

export const OPERATIONAL_STATUS = {
  AVAILABLE: 'Available',
  NOT_AVAILABLE: 'Not Available',
}

export const RECRUITMENT_STATUS = {
  INACTIVE: 'Inactive',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
}

export const RECRUITMENT_AUDIENCE = {
  B2C: 'B2C',
  INTERNAL: 'Internal Only',
}

export const INTERVIEW_TYPE = {
  LOCATION: 'Location',
  ONLINE: 'Online',
}

export const INTERVIEW_STATUS = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const CANDIDATE_STATUS = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
}

export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LEAVE: 'Leave',
  OFF: 'Off',
}

export const RESOURCE_CATEGORY_PRESETS = ['Bed', 'Machine', 'Equipment', 'Vehicle']

export const RESOURCE_BEHAVIOR = {
  DEDICATED: 'Dedicated',
  SHARED: 'Shared',
}

export const RESOURCE_LOCATION_TYPE = {
  INSIDE_WORKSPACE: 'Inside Workspace',
  INDEPENDENT: 'Independent Resource',
}

export const REPEAT_PATTERN = {
  NONE: 'Do not repeat',
  WEEKLY: 'Repeat weekly',
  CUSTOM: 'Custom',
}

export const ASSIGNMENT_STATUS = {
  UPCOMING: 'Upcoming',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const DAY_OF_WEEK = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
}

export const DAY_OF_WEEK_SHORT = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
}

/** Generic enum → { value, label } list, for <select> options. */
export function toOptions(enumMap) {
  return Object.entries(enumMap).map(([value, label]) => ({ value, label }))
}
