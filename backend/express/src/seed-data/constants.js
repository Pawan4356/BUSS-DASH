export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
export const MON_TO_SAT = [...WEEKDAYS, 'SAT']
export const ALL_DAYS = [...MON_TO_SAT, 'SUN']

export const ALL_MODULES = {
  staffDirectory: true,
  staffRecruitment: true,
  staffAttendance: true,
  resourceDirectory: true,
  operationalScheduling: true,
  operationalSchedulingPremium: true,
}

export const NO_MODULES = {
  staffDirectory: false,
  staffRecruitment: false,
  staffAttendance: false,
  resourceDirectory: false,
  operationalScheduling: false,
  operationalSchedulingPremium: false,
}
