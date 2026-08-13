import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ConfirmDialog,
  EmptyState,
  KebabMenu,
  StatusBadge,
  SummaryStats,
  TableSkeleton,
  useToast,
} from '../../shared/components'
import { BUSINESS_STATUS, OPERATIONAL_STATUS } from '../../shared/ui-tags'
import {
  useDeleteResourceMutation,
  useDeleteWorkspaceMutation,
  useGetResourceDirectorySummaryQuery,
  useListResourcesQuery,
  useListWorkspacesQuery,
} from './api'
import { AddWorkspaceModal } from './AddWorkspaceModal'
import { AddResourceModal } from './AddResourceModal'

export function ResourceDirectoryHome() {
  const [tab, setTab] = useState('workspaces')
  const { data: summary, isLoading: summaryLoading } = useGetResourceDirectorySummaryQuery()

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Resource Directory</h1>
      </div>

      <SummaryStats
        loading={summaryLoading}
        stats={[
          { label: 'Total Workspaces', value: summary?.totalWorkspaces ?? '–' },
          { label: 'Total Resources', value: summary?.totalResources ?? '–' },
          { label: 'Active Resources', value: summary?.activeResources ?? '–' },
          { label: 'Under Maintenance', value: summary?.underMaintenance ?? '–' },
          { label: 'Awaiting Scheduling', value: summary?.awaitingScheduling ?? '–' },
        ]}
      />

      <div className="toolbar">
        <button type="button" className={`btn ${tab === 'workspaces' ? 'btn-primary' : ''}`} onClick={() => setTab('workspaces')}>
          Workspaces
        </button>
        <button type="button" className={`btn ${tab === 'resources' ? 'btn-primary' : ''}`} onClick={() => setTab('resources')}>
          Resources
        </button>
      </div>

      {tab === 'workspaces' ? <WorkspacesTab /> : <ResourcesTab />}
    </div>
  )
}

function WorkspacesTab() {
  const [adding, setAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const { data: workspaces, isLoading } = useListWorkspacesQuery()
  const [deleteWorkspace] = useDeleteWorkspaceMutation()
  const navigate = useNavigate()
  const { push } = useToast()

  async function confirmDelete() {
    try {
      await deleteWorkspace(pendingDelete.id).unwrap()
      push(`Removed ${pendingDelete.name}`)
    } catch {
      push('Could not remove workspace', { tone: 'danger' })
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-spacer" />
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          + Add Workspace
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : workspaces.length === 0 ? (
        <EmptyState title="No workspaces yet" description="Add your first workspace to get started." />
      ) : (
        <div className="summary-grid">
          {workspaces.map((w) => (
            <div key={w.id} className="card stat-tile">
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => navigate(`workspaces/${w.id}`)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 600, textAlign: 'left' }}
                >
                  {w.name}
                </button>
                <KebabMenu
                  items={[
                    { label: 'View details', onClick: () => navigate(`workspaces/${w.id}`) },
                    { label: 'Edit', onClick: () => navigate(`workspaces/${w.id}`, { state: { startInEdit: true } }) },
                    { label: 'Delete', danger: true, onClick: () => setPendingDelete(w) },
                  ]}
                />
              </div>
              <div className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
                {w.subSpaceCount} sub-spaces · {w.resourceCount} resources
              </div>
              <div style={{ marginTop: 8 }}>
                <StatusBadge value={w.businessStatus} label={BUSINESS_STATUS[w.businessStatus]} />
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <AddWorkspaceModal onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function ResourcesTab() {
  const [adding, setAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name-asc')
  const { data: resources, isLoading } = useListResourcesQuery({ search: search || undefined, sort })
  const [deleteResource] = useDeleteResourceMutation()
  const navigate = useNavigate()
  const { push } = useToast()

  async function confirmDelete() {
    try {
      await deleteResource(pendingDelete.id).unwrap()
      push(`Removed ${pendingDelete.name}`)
    } catch {
      push('Could not remove resource', { tone: 'danger' })
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <div className="toolbar">
        <input className="input" style={{ maxWidth: 240 }} placeholder="Search resources…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" style={{ maxWidth: 200 }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="recently-created">Recently Created</option>
          <option value="recently-updated">Recently Updated</option>
        </select>
        <div className="toolbar-spacer" />
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          + Add Resource
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : resources.length === 0 ? (
        <EmptyState title="No resources yet" description="Add your first resource to get started." />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Category</th>
                <th>Business Status</th>
                <th>Operational Status</th>
                <th>Behavior</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button
                      type="button"
                      onClick={() => navigate(`resources/${r.id}`)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                    >
                      {r.name}
                    </button>
                  </td>
                  <td>{r.location.length > 0 ? r.location.join(', ') : 'Independent'}</td>
                  <td>{r.category ?? '—'}</td>
                  <td>
                    <StatusBadge value={r.businessStatus} label={BUSINESS_STATUS[r.businessStatus]} />
                  </td>
                  <td>{r.operationalStatus ? <StatusBadge value={r.operationalStatus} label={OPERATIONAL_STATUS[r.operationalStatus]} /> : '—'}</td>
                  <td>{r.behavior}</td>
                  <td>
                    <KebabMenu
                      items={[
                        { label: 'View details', onClick: () => navigate(`resources/${r.id}`) },
                        { label: 'Edit', onClick: () => navigate(`resources/${r.id}`, { state: { startInEdit: true } }) },
                        { label: 'Delete', danger: true, onClick: () => setPendingDelete(r) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && <AddResourceModal onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
