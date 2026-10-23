/**
 * The list endpoint nests assignments under workspaces and resources. For a
 * flat "who is where today" view, walk that tree once, tagging each
 * assignment with what it's for and where. An assignment that names both a
 * workspace and a resource shows up under both, so resources go first and
 * win the dedupe — they are the more specific label.
 */
export function flattenAssignments(list) {
  const seen = new Set()
  const out = []

  const addResource = (r, where) => {
    if (r.behavior === 'DEDICATED') {
      if (r.assignee) out.push({ id: `dedicated-${r.id}`, staffName: r.assignee, what: r.name, where, dedicated: true })
      return
    }
    for (const a of r.assignments ?? []) {
      if (seen.has(a.id)) continue
      seen.add(a.id)
      out.push({ ...a, what: r.name, where })
    }
  }

  for (const w of list.workspaceResources) {
    for (const r of w.resources) addResource(r, w.name)
  }
  for (const r of list.independentResources) addResource(r, 'Independent')
  for (const w of list.workspaceResources) {
    for (const a of w.assignments) {
      if (seen.has(a.id)) continue
      seen.add(a.id)
      out.push({ ...a, what: a.note || 'Workspace cover', where: w.name })
    }
  }
  return out
}
