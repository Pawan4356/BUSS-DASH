const STAFF_DETAIL_INCLUDE = {
  workingSchedule: true,
  workResponsibility: true,
  workspaceResponsibilities: { include: { workspace: { select: { id: true, name: true } } } },
  resourceResponsibilities: { include: { resource: { select: { id: true, name: true } } } },
}

function responsibilitiesCount(staff) {
  const workChecklist = staff.workResponsibility
    ? [
        staff.workResponsibility.staffRecruitment,
        staff.workResponsibility.staffAttendance,
        staff.workResponsibility.operationalScheduling,
      ].filter(Boolean).length
    : 0
  return workChecklist + (staff.workspaceResponsibilities?.length ?? 0) + (staff.resourceResponsibilities?.length ?? 0)
}

export function serializeStaffListItem(staff) {
  return {
    id: staff.id,
    accountId: staff.accountId,
    name: [staff.firstName, staff.lastName].filter(Boolean).join(' ') || null,
    title: staff.title,
    employmentType: staff.employmentType,
    status: staff.status,
    responsibilitiesCount: responsibilitiesCount(staff),
    archived: staff.archived,
  }
}

export function serializeStaffDetail(staff) {
  return {
    ...serializeStaffListItem(staff),
    firstName: staff.firstName,
    lastName: staff.lastName,
    phoneNumber: staff.phoneNumber,
    gender: staff.gender,
    dateOfBirth: staff.dateOfBirth,
    profilePhoto: staff.profilePhoto,
    dateOfJoining: staff.dateOfJoining,
    yearsOfExperience: staff.yearsOfExperience,
    qualifications: staff.qualifications,
    pastExperience: staff.pastExperience,
    workingSchedule: staff.workingSchedule,
    workResponsibility: staff.workResponsibility ?? {
      staffRecruitment: false,
      staffAttendance: false,
      operationalScheduling: false,
    },
    workspaceResponsibilities: staff.workspaceResponsibilities.map((r) => r.workspace),
    resourceResponsibilities: staff.resourceResponsibilities.map((r) => r.resource),
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  }
}

export { STAFF_DETAIL_INCLUDE }
