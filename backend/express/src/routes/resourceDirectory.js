import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { requireFlag } from '../middleware/requireFlag.js'
import { FLAGS } from '../lib/entitlements.js'
import {
  serializeResourceDetail,
  serializeResourceListItem,
  serializeWorkspaceDetail,
  serializeWorkspaceListItem,
} from '../lib/resourceHelpers.js'

export const resourceDirectoryRouter = Router()
resourceDirectoryRouter.use(requireAuth, requireFlag(FLAGS.RESOURCE_DIRECTORY))

const WORKSPACE_LIST_INCLUDE = { subSpaces: true, resources: true }
const WORKSPACE_DETAIL_INCLUDE = {
  subSpaces: true,
  resources: true,
  responsibleStaff: { include: { staff: { select: { id: true, firstName: true, lastName: true } } } },
}
const RESOURCE_LIST_INCLUDE = {
  workspaces: { include: { workspace: { select: { id: true, name: true } } } },
  responsibleStaff: { include: { staff: { select: { id: true, firstName: true, lastName: true } } } },
}

// See docs/decisions.md #4 — no fields were given for this summary in the raw spec.
resourceDirectoryRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const [totalWorkspaces, totalResources, activeResources, underMaintenance, awaitingScheduling] =
      await Promise.all([
        prisma.workspace.count({ where: { businessId: req.businessId } }),
        prisma.resource.count({ where: { businessId: req.businessId } }),
        prisma.resource.count({ where: { businessId: req.businessId, businessStatus: 'ACTIVE' } }),
        prisma.resource.count({ where: { businessId: req.businessId, businessStatus: 'MAINTENANCE' } }),
        prisma.resource.count({
          where: { businessId: req.businessId, schedulingRequired: true, assignments: { none: {} } },
        }),
      ])
    res.json({ totalWorkspaces, totalResources, activeResources, underMaintenance, awaitingScheduling })
  }),
)

// ── Workspaces ──────────────────────────────────────────────────────────

resourceDirectoryRouter.get(
  '/workspaces',
  asyncHandler(async (req, res) => {
    const workspaces = await prisma.workspace.findMany({
      where: { businessId: req.businessId },
      include: WORKSPACE_LIST_INCLUDE,
      orderBy: { name: 'asc' },
    })
    res.json(workspaces.map(serializeWorkspaceListItem))
  }),
)

resourceDirectoryRouter.post(
  '/workspaces',
  asyncHandler(async (req, res) => {
    const { name, type } = req.body
    if (!name) return res.status(400).json({ message: 'name is required' })

    const duplicate = await prisma.workspace.findFirst({ where: { businessId: req.businessId, name } })
    if (duplicate) return res.status(409).json({ message: 'A workspace with this name already exists' })

    const workspace = await prisma.workspace.create({
      data: { businessId: req.businessId, name, type },
      include: WORKSPACE_DETAIL_INCLUDE,
    })
    res.status(201).json(serializeWorkspaceDetail(workspace, { includeResponsible: req.flags.staffDirectory }))
  }),
)

resourceDirectoryRouter.get(
  '/workspaces/:id',
  asyncHandler(async (req, res) => {
    const workspace = await prisma.workspace.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
      include: WORKSPACE_DETAIL_INCLUDE,
    })
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' })
    res.json(serializeWorkspaceDetail(workspace, { includeResponsible: req.flags.staffDirectory }))
  }),
)

resourceDirectoryRouter.patch(
  '/workspaces/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.workspace.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
    if (!existing) return res.status(404).json({ message: 'Workspace not found' })

    const { name, type, businessStatus, subSpaces } = req.body
    await prisma.$transaction(async (tx) => {
      await tx.workspace.update({
        where: { id: existing.id },
        data: { ...(name && { name }), ...(type !== undefined && { type }), ...(businessStatus && { businessStatus }) },
      })
      if (subSpaces) {
        await tx.subSpace.deleteMany({ where: { workspaceId: existing.id } })
        if (subSpaces.length > 0) {
          await tx.subSpace.createMany({
            data: subSpaces.map((s) => ({ workspaceId: existing.id, name: s.name })),
          })
        }
      }
    })

    const workspace = await prisma.workspace.findUnique({ where: { id: existing.id }, include: WORKSPACE_DETAIL_INCLUDE })
    res.json(serializeWorkspaceDetail(workspace, { includeResponsible: req.flags.staffDirectory }))
  }),
)

resourceDirectoryRouter.delete(
  '/workspaces/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.workspace.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
    if (!existing) return res.status(404).json({ message: 'Workspace not found' })
    await prisma.workspace.delete({ where: { id: existing.id } })
    res.status(204).end()
  }),
)

// ── Resources ───────────────────────────────────────────────────────────

resourceDirectoryRouter.get(
  '/resources',
  asyncHandler(async (req, res) => {
    const { category, workspaceId, businessStatus, operationalStatus, search, sort } = req.query

    const orderBy =
      {
        'name-asc': { name: 'asc' },
        'name-desc': { name: 'desc' },
        'recently-created': { createdAt: 'desc' },
        'recently-updated': { updatedAt: 'desc' },
      }[sort] ?? { name: 'asc' }

    const resources = await prisma.resource.findMany({
      where: {
        businessId: req.businessId,
        ...(category && { category: String(category) }),
        ...(businessStatus && { businessStatus: String(businessStatus) }),
        ...(operationalStatus && { operationalStatus: String(operationalStatus) }),
        ...(workspaceId && { workspaces: { some: { workspaceId: String(workspaceId) } } }),
        ...(search && { name: { contains: String(search), mode: 'insensitive' } }),
      },
      include: RESOURCE_LIST_INCLUDE,
      orderBy,
    })
    res.json(resources.map((r) => serializeResourceListItem(r, { includeResponsible: req.flags.staffDirectory })))
  }),
)

resourceDirectoryRouter.post(
  '/resources',
  asyncHandler(async (req, res) => {
    const { name, quantity = 1, category, behavior, schedulingRequired, workspaceIds } = req.body
    if (!name) return res.status(400).json({ message: 'name is required' })

    const names = quantity > 1 ? Array.from({ length: quantity }, (_, i) => `${name}(${i + 1})`) : [name]
    for (const n of names) {
      const duplicate = await prisma.resource.findFirst({ where: { businessId: req.businessId, name: n } })
      if (duplicate) return res.status(409).json({ message: `A resource named "${n}" already exists` })
    }

    const created = await prisma.$transaction(
      names.map((n) =>
        prisma.resource.create({
          data: {
            businessId: req.businessId,
            name: n,
            category,
            behavior,
            schedulingRequired: Boolean(schedulingRequired),
            ...(workspaceIds?.length > 0 && {
              workspaces: { createMany: { data: workspaceIds.map((workspaceId) => ({ workspaceId })) } },
            }),
          },
          include: RESOURCE_LIST_INCLUDE,
        }),
      ),
    )

    res.status(201).json(created.map((r) => serializeResourceDetail(r, { includeResponsible: req.flags.staffDirectory })))
  }),
)

resourceDirectoryRouter.get(
  '/resources/:id',
  asyncHandler(async (req, res) => {
    const resource = await prisma.resource.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
      include: RESOURCE_LIST_INCLUDE,
    })
    if (!resource) return res.status(404).json({ message: 'Resource not found' })
    res.json(serializeResourceDetail(resource, { includeResponsible: req.flags.staffDirectory }))
  }),
)

resourceDirectoryRouter.patch(
  '/resources/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.resource.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
    if (!existing) return res.status(404).json({ message: 'Resource not found' })

    const { category, businessStatus, behavior, schedulingRequired, workspaceIds } = req.body
    await prisma.$transaction(async (tx) => {
      await tx.resource.update({
        where: { id: existing.id },
        data: {
          ...(category !== undefined && { category }),
          ...(businessStatus && { businessStatus }),
          ...(behavior && { behavior }),
          ...(schedulingRequired !== undefined && { schedulingRequired }),
        },
      })
      if (workspaceIds) {
        await tx.resourceWorkspace.deleteMany({ where: { resourceId: existing.id } })
        if (workspaceIds.length > 0) {
          await tx.resourceWorkspace.createMany({
            data: workspaceIds.map((workspaceId) => ({ resourceId: existing.id, workspaceId })),
          })
        }
      }
    })

    const resource = await prisma.resource.findUnique({ where: { id: existing.id }, include: RESOURCE_LIST_INCLUDE })
    res.json(serializeResourceDetail(resource, { includeResponsible: req.flags.staffDirectory }))
  }),
)

resourceDirectoryRouter.delete(
  '/resources/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.resource.findFirst({ where: { id: req.params.id, businessId: req.businessId } })
    if (!existing) return res.status(404).json({ message: 'Resource not found' })
    await prisma.resource.delete({ where: { id: existing.id } })
    res.status(204).end()
  }),
)
