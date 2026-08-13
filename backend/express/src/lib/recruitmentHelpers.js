const RECRUITMENT_DETAIL_INCLUDE = {
  interviewRounds: { orderBy: { roundNumber: 'asc' } },
  candidates: { select: { id: true, status: true } },
}

export function serializeRecruitmentListItem(recruitment) {
  return {
    id: recruitment.id,
    role: recruitment.role,
    employmentType: recruitment.employmentType,
    status: recruitment.status,
    totalCandidates: recruitment.candidates.length,
    hired: recruitment.candidates.filter((c) => c.status === 'HIRED').length,
  }
}

export function serializeRecruitmentDetail(recruitment) {
  return {
    ...serializeRecruitmentListItem(recruitment),
    experienceRequired: recruitment.experienceRequired,
    numberOfOpenings: recruitment.numberOfOpenings,
    description: recruitment.description,
    requirements: recruitment.requirements,
    benefits: recruitment.benefits,
    audience: recruitment.audience,
    interviewRequired: recruitment.interviewRequired,
    launchDate: recruitment.launchDate,
    interviewRounds: recruitment.interviewRounds,
    createdAt: recruitment.createdAt,
  }
}

export function serializeCandidate(candidate) {
  return {
    id: candidate.id,
    accountId: candidate.accountId,
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    cvUrl: candidate.cvUrl,
    qualifications: candidate.qualifications,
    experience: candidate.experience,
    coverNote: candidate.coverNote,
    portfolio: candidate.portfolio,
    source: candidate.source,
    appliedDate: candidate.appliedDate,
    status: candidate.status,
  }
}

export { RECRUITMENT_DETAIL_INCLUDE }
