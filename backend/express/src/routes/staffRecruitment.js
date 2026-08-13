import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { requireFlag } from '../middleware/requireFlag.js'
import { FLAGS } from '../lib/entitlements.js'
import {
  RECRUITMENT_DETAIL_INCLUDE,
  serializeCandidate,
  serializeRecruitmentDetail,
  serializeRecruitmentListItem,
} from '../lib/recruitmentHelpers.js'

export const staffRecruitmentRouter = Router()
staffRecruitmentRouter.use(requireAuth, requireFlag(FLAGS.STAFF_RECRUITMENT))

// "Offers Sent" has no dedicated candidate status in the spec's 4-value
// enum (Applied/Shortlisted/Rejected/Hired) — approximated as Shortlisted
// pending clarification. See docs/decisions.md.
staffRecruitmentRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const recruitments = await prisma.recruitment.findMany({
      where: { businessId: req.businessId },
      select: { status: true, numberOfOpenings: true },
    })
    const activeRecruitments = recruitments.filter((r) => r.status === 'ACTIVE')
    const totalOpenPositions = activeRecruitments.reduce((sum, r) => sum + (r.numberOfOpenings ?? 0), 0)

    const [applicationsReceived, interviewsScheduled, offersSent, hiredCandidates] = await Promise.all([
      prisma.candidate.count({ where: { recruitment: { businessId: req.businessId } } }),
      prisma.interviewRound.count({
        where: { status: 'SCHEDULED', recruitment: { businessId: req.businessId } },
      }),
      prisma.candidate.count({ where: { status: 'SHORTLISTED', recruitment: { businessId: req.businessId } } }),
      prisma.candidate.count({ where: { status: 'HIRED', recruitment: { businessId: req.businessId } } }),
    ])

    res.json({
      totalOpenPositions,
      activeRecruitments: activeRecruitments.length,
      applicationsReceived,
      interviewsScheduled,
      offersSent,
      hiredCandidates,
    })
  }),
)

staffRecruitmentRouter.get(
  '/recruitments',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query
    const recruitments = await prisma.recruitment.findMany({
      where: {
        businessId: req.businessId,
        ...(status && { status: String(status) }),
        ...(search && { role: { contains: String(search), mode: 'insensitive' } }),
      },
      include: RECRUITMENT_DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    res.json(recruitments.map(serializeRecruitmentListItem))
  }),
)

staffRecruitmentRouter.post(
  '/recruitments',
  asyncHandler(async (req, res) => {
    const { role } = req.body
    if (!role) return res.status(400).json({ message: 'role is required' })

    const audience = req.business.recruitmentModelType === 'BOTH' ? null : req.business.recruitmentModelType
    const recruitment = await prisma.recruitment.create({
      data: { businessId: req.businessId, role, status: 'INACTIVE', audience },
      include: RECRUITMENT_DETAIL_INCLUDE,
    })
    res.status(201).json(serializeRecruitmentDetail(recruitment))
  }),
)

async function loadRecruitmentOr404(req, res) {
  const recruitment = await prisma.recruitment.findFirst({
    where: { id: req.params.id, businessId: req.businessId },
    include: RECRUITMENT_DETAIL_INCLUDE,
  })
  if (!recruitment) res.status(404).json({ message: 'Recruitment not found' })
  return recruitment
}

staffRecruitmentRouter.get(
  '/recruitments/:id',
  asyncHandler(async (req, res) => {
    const recruitment = await loadRecruitmentOr404(req, res)
    if (!recruitment) return
    res.json(serializeRecruitmentDetail(recruitment))
  }),
)

const EDITABLE_RECRUITMENT_FIELDS = [
  'role',
  'experienceRequired',
  'employmentType',
  'numberOfOpenings',
  'description',
  'requirements',
  'benefits',
  'interviewRequired',
]

staffRecruitmentRouter.patch(
  '/recruitments/:id',
  asyncHandler(async (req, res) => {
    const existing = await loadRecruitmentOr404(req, res)
    if (!existing) return

    const data = {}
    for (const field of EDITABLE_RECRUITMENT_FIELDS) {
      if (field in req.body) data[field] = req.body[field]
    }
    if (req.business.recruitmentModelType === 'BOTH' && req.body.audience) {
      data.audience = req.body.audience
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) await tx.recruitment.update({ where: { id: existing.id }, data })

      if (req.body.interviewRounds) {
        await tx.interviewRound.deleteMany({ where: { recruitmentId: existing.id } })
        if (req.body.interviewRounds.length > 0) {
          await tx.interviewRound.createMany({
            data: req.body.interviewRounds.map((round, index) => ({
              recruitmentId: existing.id,
              roundNumber: index + 1,
              type: round.type,
              locationAddress: round.locationAddress ?? null,
              onlineLink: round.onlineLink ?? null,
              date: round.date ? new Date(round.date) : null,
              time: round.time ?? null,
              interviewerStaffId: round.interviewerStaffId ?? null,
              interviewerManualName: round.interviewerManualName ?? null,
              description: round.description ?? null,
              status: round.status ?? 'SCHEDULED',
            })),
          })
        }
      }
    })

    const recruitment = await prisma.recruitment.findUnique({
      where: { id: existing.id },
      include: RECRUITMENT_DETAIL_INCLUDE,
    })
    res.json(serializeRecruitmentDetail(recruitment))
  }),
)

staffRecruitmentRouter.post(
  '/recruitments/:id/duplicate',
  asyncHandler(async (req, res) => {
    const existing = await prisma.recruitment.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
    if (!existing) return res.status(404).json({ message: 'Recruitment not found' })

    const siblings = await prisma.recruitment.count({
      where: { businessId: req.businessId, role: { startsWith: existing.role } },
    })

    const copy = await prisma.recruitment.create({
      data: {
        businessId: req.businessId,
        role: `${existing.role} copy(${siblings})`,
        experienceRequired: existing.experienceRequired,
        employmentType: existing.employmentType,
        numberOfOpenings: existing.numberOfOpenings,
        description: existing.description,
        requirements: existing.requirements,
        benefits: existing.benefits,
        audience: existing.audience,
        interviewRequired: existing.interviewRequired,
        status: 'INACTIVE',
      },
      include: RECRUITMENT_DETAIL_INCLUDE,
    })
    res.status(201).json(serializeRecruitmentDetail(copy))
  }),
)

staffRecruitmentRouter.post(
  '/recruitments/:id/close',
  asyncHandler(async (req, res) => {
    const existing = await prisma.recruitment.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
    if (!existing) return res.status(404).json({ message: 'Recruitment not found' })
    if (existing.status !== 'ACTIVE') return res.status(400).json({ message: 'Only active recruitments can be closed' })

    const recruitment = await prisma.recruitment.update({
      where: { id: existing.id },
      data: { status: 'CLOSED' },
      include: RECRUITMENT_DETAIL_INCLUDE,
    })
    res.json(serializeRecruitmentDetail(recruitment))
  }),
)

staffRecruitmentRouter.post(
  '/recruitments/:id/launch',
  asyncHandler(async (req, res) => {
    const existing = await prisma.recruitment.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
    if (!existing) return res.status(404).json({ message: 'Recruitment not found' })
    if (existing.status !== 'INACTIVE') {
      return res.status(400).json({ message: 'Only inactive recruitments can be launched' })
    }

    const recruitment = await prisma.recruitment.update({
      where: { id: existing.id },
      data: { status: 'ACTIVE', launchDate: new Date() },
      include: RECRUITMENT_DETAIL_INCLUDE,
    })
    res.json(serializeRecruitmentDetail(recruitment))
  }),
)

// ── Candidates ──────────────────────────────────────────────────────────

staffRecruitmentRouter.get(
  '/recruitments/:id/candidates',
  asyncHandler(async (req, res) => {
    const recruitment = await prisma.recruitment.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
    })
    if (!recruitment) return res.status(404).json({ message: 'Recruitment not found' })

    const { source } = req.query
    const candidates = await prisma.candidate.findMany({
      where: { recruitmentId: recruitment.id, ...(source && { source: String(source) }) },
      orderBy: { appliedDate: 'desc' },
    })
    res.json(candidates.map(serializeCandidate))
  }),
)

staffRecruitmentRouter.post(
  '/recruitments/:id/candidates',
  asyncHandler(async (req, res) => {
    const recruitment = await prisma.recruitment.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
    })
    if (!recruitment) return res.status(404).json({ message: 'Recruitment not found' })
    if (recruitment.audience === 'B2C') {
      return res.status(403).json({ message: 'Manual candidates are not allowed for B2C-only postings' })
    }

    const { name, email, phone, qualifications, experience, coverNote, portfolio } = req.body
    if (!name) return res.status(400).json({ message: 'name is required' })

    const candidate = await prisma.candidate.create({
      data: {
        recruitmentId: recruitment.id,
        name,
        email,
        phone,
        qualifications,
        experience,
        coverNote,
        portfolio,
        source: 'WALK_IN',
      },
    })
    res.status(201).json(serializeCandidate(candidate))
  }),
)

async function loadCandidateOr404(req, res) {
  const candidate = await prisma.candidate.findFirst({
    where: { id: req.params.id, recruitment: { businessId: req.businessId } },
  })
  if (!candidate) res.status(404).json({ message: 'Candidate not found' })
  return candidate
}

staffRecruitmentRouter.get(
  '/candidates/:id',
  asyncHandler(async (req, res) => {
    const candidate = await loadCandidateOr404(req, res)
    if (!candidate) return
    res.json(serializeCandidate(candidate))
  }),
)

const EDITABLE_CANDIDATE_FIELDS = ['name', 'email', 'phone', 'qualifications', 'experience', 'coverNote', 'portfolio', 'status']

staffRecruitmentRouter.patch(
  '/candidates/:id',
  asyncHandler(async (req, res) => {
    const existing = await loadCandidateOr404(req, res)
    if (!existing) return
    if (existing.source !== 'WALK_IN' && Object.keys(req.body).some((k) => k !== 'status')) {
      return res.status(403).json({ message: 'Only walk-in applicants can be edited; status changes are still allowed' })
    }

    const data = {}
    for (const field of EDITABLE_CANDIDATE_FIELDS) {
      if (field in req.body) data[field] = req.body[field]
    }

    const candidate = await prisma.candidate.update({ where: { id: existing.id }, data })
    res.json(serializeCandidate(candidate))
  }),
)

staffRecruitmentRouter.post(
  '/candidates/:id/hire',
  asyncHandler(async (req, res) => {
    const existing = await loadCandidateOr404(req, res)
    if (!existing) return

    const [firstName, ...rest] = existing.name.split(' ')
    const staff = await prisma.$transaction(async (tx) => {
      await tx.candidate.update({ where: { id: existing.id }, data: { status: 'HIRED' } })
      return tx.staff.create({
        data: {
          businessId: req.businessId,
          accountId: existing.accountId,
          firstName,
          lastName: rest.join(' ') || null,
          phoneNumber: existing.phone,
          qualifications: existing.qualifications,
          pastExperience: existing.experience,
          status: 'ACTIVE',
        },
        include: {
          workingSchedule: true,
          workResponsibility: true,
          workspaceResponsibilities: true,
          resourceResponsibilities: true,
        },
      })
    })

    res.status(201).json({ staffId: staff.id })
  }),
)
