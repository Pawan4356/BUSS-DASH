import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ConfirmDialog,
  EmptyState,
  KebabMenu,
  PersonCell,
  SearchInput,
  StatusBadge,
  SummaryStats,
  TableSkeleton,
  Tabs,
  useToast,
} from '../../shared/components'
import { STAFF_STATUS, toOptions } from '../../shared/ui-tags'
import { useDeleteStaffMutation, useGetStaffSummaryQuery, useListStaffQuery } from './api'
import { InviteStaffModal } from './InviteStaffModal'
import { useGetAttendanceRegisterQuery } from '../staff-attendance/api'
import { todayIso } from '../../shared/time'
import { useNowHours } from '../../shared/time/useNow'
import { FloorTimeline } from './FloorTimeline'
import { WeekStrip } from './WeekStrip'
import { todayState } from './todayState'

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

  // The floor timeline always shows everyone working today, independent of
  // the table's search/status filters.
  const flags = useSelector((st) => st.auth.flags)
  const hasRegister = Boolean(flags?.staffAttendance)
  const now = useNowHours()
  const { data: everyone } = useListStaffQuery({ archived: false })
  const { data: register } = useGetAttendanceRegisterQuery({ date: todayIso() }, { skip: !hasRegister })
  const registerByStaff = useMemo(() => new Map((register?.rows ?? []).map((r) => [r.staffId, r])), [register])

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
        <h1 className="page-title">Staff Directory</h1>
        <button type="button" className="btn btn-primary" onClick={() => setInviting(true)}>
          + Invite Staff
        </button>
      </div>

      <SummaryStats
        loading={summaryLoading}
        stats={[
          { label: 'Total Staff', value: summary?.totalStaff ?? '–' },
          { label: 'Pending Invitations', value: summary?.pendingInvitations ?? '–', tone: 'warning' },
        ]}
      />

      {everyone && <FloorTimeline staff={everyone} registerByStaff={registerByStaff} hasRegister={hasRegister} now={now} />}


      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or title" />
        <Tabs
          ariaLabel="Filter by status"
          value={status}
          onChange={setStatus}
          options={[{ value: '', label: 'All' }, ...toOptions(STAFF_STATUS)]}
        />
        <div className="toolbar-spacer" />
        <label className="check">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          Show archived
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
                <th>Employment</th>
                <th>Working week</th>
                <th>Today</th>
                <th>Responsible for</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>
                    <PersonCell name={s.name} subtitle={s.title} onOpen={() => navigate(`/staff-directory/${s.id}`)} />
                  </td>
                  <td>{s.employmentType ?? '—'}</td>
                  <td>
                    <WeekStrip schedule={s.weekSchedule} />
                  </td>
                  <td className="today-cell">
                    <TodayCell st={todayState(s, registerByStaff.get(s.id), now, hasRegister)} />
                  </td>
                  <td>
                    <ResponsibilityChips r={s.responsibilities} />
                  </td>
                  <td>
                    <StatusBadge value={s.status} label={STAFF_STATUS[s.status]} />
                  </td>
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

function TodayCell({ st }) {
  if (st.kind === 'inactive') return <span className="none">—</span>
  if (st.kind === 'missing') return <span className="is-missing">{st.label}</span>
  return (
    <>
      <span>{st.label}</span>
      {st.late && <span className="is-late"> · late</span>}
    </>
  )
}

function ResponsibilityChips({ r }) {
  const modules = r?.modules ?? []
  const places = [...(r?.workspaces ?? []), ...(r?.resources ?? [])]
  if (modules.length + places.length === 0) return <span className="none">None assigned</span>
  return (
    <div className="chips">
      {modules.map((m) => (
        <span className="chip chip-duty" key={`m-${m}`}>
          {m}
        </span>
      ))}
      {places.map((p) => (
        <span className="chip" key={`p-${p}`}>
          {p}
        </span>
      ))}
    </div>
  )
}
