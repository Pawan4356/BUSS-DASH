import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, KebabMenu, StatusBadge, SummaryStats, TableSkeleton, useToast } from '../../shared/components'
import { RECRUITMENT_STATUS, toOptions } from '../../shared/ui-tags'
import {
  useCloseRecruitmentMutation,
  useDuplicateRecruitmentMutation,
  useGetRecruitmentSummaryQuery,
  useLaunchRecruitmentMutation,
  useListRecruitmentsQuery,
} from './api'
import { CreateRecruitmentModal } from './CreateRecruitmentModal'

export function RecruitmentList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const { push } = useToast()

  const { data: summary, isLoading: summaryLoading } = useGetRecruitmentSummaryQuery()
  const { data: recruitments, isLoading } = useListRecruitmentsQuery({
    search: search || undefined,
    status: status || undefined,
  })
  const [duplicateRecruitment] = useDuplicateRecruitmentMutation()
  const [closeRecruitment] = useCloseRecruitmentMutation()
  const [launchRecruitment] = useLaunchRecruitmentMutation()

  async function handleAction(action, id, label) {
    try {
      await action(id).unwrap()
      push(label)
    } catch (err) {
      push(err.data?.message ?? 'Action failed', { tone: 'danger' })
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Recruitment</h1>
        </div>
        <div className="cluster">
          <button type="button" className="btn" onClick={() => navigate('candidates')}>
            Candidate Applications
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            + Create Recruitment
          </button>
        </div>
      </div>

      <SummaryStats
        loading={summaryLoading}
        stats={[
          { label: 'Total Open Positions', value: summary?.totalOpenPositions ?? '–' },
          { label: 'Active Recruitments', value: summary?.activeRecruitments ?? '–' },
          { label: 'Applications Received', value: summary?.applicationsReceived ?? '–' },
          { label: 'Interviews Scheduled', value: summary?.interviewsScheduled ?? '–' },
          { label: 'Offers Sent', value: summary?.offersSent ?? '–' },
          { label: 'Hired Candidates', value: summary?.hiredCandidates ?? '–' },
        ]}
      />

      <div className="toolbar">
        <input className="input" style={{ maxWidth: 240 }} placeholder="Search by role…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {toOptions(RECRUITMENT_STATUS).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : recruitments.length === 0 ? (
        <EmptyState title="No recruitments yet" description="Create your first recruitment posting." />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Employment Type</th>
                <th>Status</th>
                <th>Total Candidates</th>
                <th>Hired</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {recruitments.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button
                      type="button"
                      onClick={() => navigate(r.id)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                    >
                      {r.role}
                    </button>
                  </td>
                  <td>{r.employmentType ?? '—'}</td>
                  <td>
                    <StatusBadge value={r.status} label={RECRUITMENT_STATUS[r.status]} />
                  </td>
                  <td>{r.totalCandidates}</td>
                  <td>{r.hired}</td>
                  <td>
                    <KebabMenu
                      items={[
                        { label: 'View setting', onClick: () => navigate(r.id) },
                        {
                          label: 'Duplicate Recruitment',
                          onClick: () => handleAction(duplicateRecruitment, r.id, 'Recruitment duplicated'),
                        },
                        ...(r.status === 'ACTIVE'
                          ? [{ label: 'Close Recruitment', onClick: () => handleAction(closeRecruitment, r.id, 'Recruitment closed') }]
                          : []),
                        ...(r.status === 'INACTIVE'
                          ? [{ label: 'Launch', onClick: () => handleAction(launchRecruitment, r.id, 'Recruitment launched') }]
                          : []),
                        { label: 'Edit setting', onClick: () => navigate(r.id) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <CreateRecruitmentModal onClose={() => setCreating(false)} />}
    </div>
  )
}
