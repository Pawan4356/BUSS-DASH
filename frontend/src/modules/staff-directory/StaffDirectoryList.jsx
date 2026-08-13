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
import { STAFF_STATUS, toOptions } from '../../shared/ui-tags'
import { useDeleteStaffMutation, useGetStaffSummaryQuery, useListStaffQuery } from './api'
import { InviteStaffModal } from './InviteStaffModal'

export function StaffDirectoryList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [archived, setArchived] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const navigate = useNavigate()
  const { push } = useToast()

  const { data: summary, isLoading: summaryLoading } = useGetStaffSummaryQuery()
  const { data: staff, isLoading, isFetching } = useListStaffQuery({
    search: search || undefined,
    status: status || undefined,
    archived,
  })
  const [deleteStaff] = useDeleteStaffMutation()

  async function confirmDelete() {
    try {
      await deleteStaff(pendingDelete.id).unwrap()
      push(`Removed ${pendingDelete.name ?? 'staff member'}`)
    } catch {
      push('Could not remove staff member', { tone: 'danger' })
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Directory</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setInviting(true)}>
          + Invite Staff
        </button>
      </div>

      <SummaryStats
        loading={summaryLoading}
        stats={[
          { label: 'Total Staff', value: summary?.totalStaff ?? '–' },
          { label: 'Pending Invitations', value: summary?.pendingInvitations ?? '–' },
        ]}
      />

      <div className="toolbar">
        <input
          className="input"
          style={{ maxWidth: 240 }}
          placeholder="Search staff…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {toOptions(STAFF_STATUS).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="toolbar-spacer" />
        <label className="cluster" style={{ fontSize: 13 }}>
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          Archived
        </label>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : staff.length === 0 ? (
        <EmptyState
          title={archived ? 'No archived staff' : 'No staff yet'}
          description={archived ? undefined : 'Invite your first staff member to get started.'}
        />
      ) : (
        <div className="table-wrap card">
          <table className="table" style={{ opacity: isFetching ? 0.6 : 1 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Employment Type</th>
                <th>Status</th>
                <th>Responsibilities</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>
                    <button
                      type="button"
                      onClick={() => navigate(`/staff-directory/${s.id}`)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                    >
                      {s.name ?? <span className="text-muted">Awaiting details</span>}
                    </button>
                  </td>
                  <td>{s.title ?? '—'}</td>
                  <td>{s.employmentType ?? '—'}</td>
                  <td>
                    <StatusBadge value={s.status} label={STAFF_STATUS[s.status]} />
                  </td>
                  <td>{s.responsibilitiesCount}</td>
                  <td>
                    <KebabMenu
                      items={[
                        { label: 'View details', onClick: () => navigate(`/staff-directory/${s.id}`) },
                        {
                          label: 'Edit',
                          onClick: () => navigate(`/staff-directory/${s.id}`, { state: { startInEdit: true } }),
                        },
                        { label: 'Delete', danger: true, onClick: () => setPendingDelete(s) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inviting && <InviteStaffModal onClose={() => setInviting(false)} />}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Remove ${pendingDelete?.name ?? 'this staff member'}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
