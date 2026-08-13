export function serializeWorkspaceListItem(workspace) {
  return {
    id: workspace.id,
    name: workspace.name,
    subSpaceCount: workspace.subSpaces.length,
    resourceCount: workspace.resources.length,
    businessStatus: workspace.businessStatus,
  }
}

export function serializeWorkspaceDetail(workspace, { includeResponsible }) {
  return {
    ...serializeWorkspaceListItem(workspace),
    type: workspace.type,
    operationalStatus: workspace.operationalStatus,
    subSpaces: workspace.subSpaces.map((s) => ({ id: s.id, name: s.name })),
    responsiblePersons: includeResponsible
      ? workspace.responsibleStaff.map((r) => ({ id: r.staff.id, name: staffName(r.staff) }))
      : undefined,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  }
}

export function serializeResourceListItem(resource, { includeResponsible }) {
  return {
    id: resource.id,
    name: resource.name,
    location: resource.workspaces.map((w) => w.workspace.name),
    category: resource.category,
    businessStatus: resource.businessStatus,
    operationalStatus: resource.operationalStatus,
    responsible: includeResponsible ? resource.responsibleStaff.map((r) => staffName(r.staff)) : undefined,
    behavior: resource.behavior,
    schedulingRequired: resource.schedulingRequired,
  }
}

export function serializeResourceDetail(resource, opts) {
  return {
    ...serializeResourceListItem(resource, opts),
    workspaceIds: resource.workspaces.map((w) => w.workspaceId),
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  }
}

function staffName(staff) {
  return [staff.firstName, staff.lastName].filter(Boolean).join(' ') || staff.id
}
