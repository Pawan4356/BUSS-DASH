import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { requireFlag } from '../middleware/requireFlag.js'
import { FLAGS } from '../lib/entitlements.js'
import { STAFF_DETAIL_INCLUDE, serializeStaffDetail, serializeStaffListItem } from '../lib/staffHelpers.js'

export const staffDirectoryRouter = Router()
staffDirectoryRouter.use(requireAuth, requireFlag(FLAGS.STAFF_DIRECTORY))

staffDirectoryRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const [totalStaff, pendingInvitations] = await Promise.all([
      prisma.staff.count({ where: { businessId: req.businessId, archived: false } }),
      prisma.staff.count({ where: { businessId: req.businessId, status: 'PENDING' } }),
    ])
    res.json({ totalStaff, pendingInvitations })
  }),
)

staffDirectoryRouter.get(
  '/staff',
  asyncHandler(async (req, res) => {
    const { title, status, employmentType, responsibility, search, archived } = req.query

    const where = {
      businessId: req.businessId,
      archived: archived === 'true',
      ...(title && { title: { contains: String(title), mode: 'insensitive' } }),
      ...(status && { status: String(status) }),
      ...(employmentType && { employmentType: { contains: String(employmentType), mode: 'insensitive' } }),
      ...(responsibility && {
        workResponsibility: { [String(responsibility)]: true },
      }),
      ...(search && {
        OR: [
          { firstName: { contains: String(search), mode: 'insensitive' } },
          { lastName: { contains: String(search), mode: 'insensitive' } },
          { accountId: { contains: String(search), mode: 'insensitive' } },
        ],
      }),
    }

    const staff = await prisma.staff.findMany({
      where,
      include: STAFF_DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    res.json(staff.map(serializeStaffListItem))
  }),
)

staffDirectoryRouter.post(
  '/staff',
  asyncHandler(async (req, res) => {
    const { accountId } = req.body
    if (!accountId) return res.status(400).json({ message: 'accountId is required' })

    const staff = await prisma.staff.create({
      data: { businessId: req.businessId, accountId, status: 'PENDING' },
      include: STAFF_DETAIL_INCLUDE,
    })
    res.status(201).json(serializeStaffDetail(staff))
  }),
)

staffDirectoryRouter.get(
  '/staff/:id',
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
      include: STAFF_DETAIL_INCLUDE,
    })
    if (!staff) return res.status(404).json({ message: 'Staff member not found' })
    res.json(serializeStaffDetail(staff))
  }),
)

const EDITABLE_FIELDS = [
  'firstName',
  'lastName',
  'phoneNumber',
  'gender',
  'dateOfBirth',
  'profilePhoto',
  'title',
  'dateOfJoining',
  'yearsOfExperience',
  'qualifications',
  'pastExperience',
  'employmentType',
  'status',
  'archived',
]

staffDirectoryRouter.patch(
  '/staff/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.staff.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
    if (!existing) return res.status(404).json({ message: 'Staff member not found' })

    const data = {}
    for (const field of EDITABLE_FIELDS) {
      if (field in req.body) data[field] = req.body[field]
    }
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth)
    if (data.dateOfJoining) data.dateOfJoining = new Date(data.dateOfJoining)

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.staff.update({ where: { id: existing.id }, data })
      }

      if (req.body.workingSchedule) {
        await tx.workingScheduleEntry.deleteMany({ where: { staffId: existing.id } })
        const rows = req.body.workingSchedule.flatMap((day) =>
          day.isOff
            ? [{ staffId: existing.id, dayOfWeek: day.dayOfWeek, isOff: true }]
            : day.windows.map((w) => ({
                staffId: existing.id,
                dayOfWeek: day.dayOfWeek,
                isOff: false,
                startTime: w.start,
                endTime: w.end,
              })),
        )
        if (rows.length > 0) await tx.workingScheduleEntry.createMany({ data: rows })
      }

      if (req.body.workResponsibility) {
        await tx.workResponsibility.upsert({
          where: { staffId: existing.id },
          create: { staffId: existing.id, ...req.body.workResponsibility },
          update: req.body.workResponsibility,
        })
      }

      if (req.flags.resourceDirectory && req.body.workspaceIds) {
        await tx.workspaceResponsibility.deleteMany({ where: { staffId: existing.id } })
        if (req.body.workspaceIds.length > 0) {
          await tx.workspaceResponsibility.createMany({
            data: req.body.workspaceIds.map((workspaceId) => ({ staffId: existing.id, workspaceId })),
          })
        }
      }

      if (req.flags.resourceDirectory && req.body.resourceIds) {
        await tx.resourceResponsibility.deleteMany({ where: { staffId: existing.id } })
        if (req.body.resourceIds.length > 0) {
          await tx.resourceResponsibility.createMany({
            data: req.body.resourceIds.map((resourceId) => ({ staffId: existing.id, resourceId })),
          })
        }
      }
    })

    const staff = await prisma.staff.findUnique({ where: { id: existing.id }, include: STAFF_DETAIL_INCLUDE })
    res.json(serializeStaffDetail(staff))
  }),
)

staffDirectoryRouter.delete(
  '/staff/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.staff.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
    if (!existing) return res.status(404).json({ message: 'Staff member not found' })
    await prisma.staff.delete({ where: { id: existing.id } })
    res.status(204).end()
  }),
)
