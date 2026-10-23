import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, KebabMenu, SearchInput, StatusBadge, SummaryStats, TableSkeleton, Tabs, useToast } from '../../shared/components'
import { RECRUITMENT_STATUS, toOptions } from '../../shared/ui-tags'
import {
  useCloseRecruitmentMutation,
  useDuplicateRecruitmentMutation,
  useGetRecruitmentSummaryQuery,
  useLaunchRecruitmentMutation,
  useListRecruitmentsQuery,
} from './api'
import { CreateRecruitmentModal } from './CreateRecruitmentModal'
import { RecruitmentPipeline } from './RecruitmentPipeline'

function describeRole(r) {
  const openings = r.numberOfOpenings ? `${r.numberOfOpenings} opening${r.numberOfOpenings === 1 ? '' : 's'}` : null
  const audience = r.audience === 'B2C' ? 'public listing' : r.audience === 'INTERNAL' ? 'internal only' : null
  return [r.employmentType, openings, r.experienceRequired, audience].filter(Boolean).join(', ') || 'No details yet'
}

export function RecruitmentList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
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

  // Default to the first role still taking applications, not just the newest.
  const selected =
    recruitments?.find((r) => r.id === selectedId) ??
    recruitments?.find((r) => r.status === 'ACTIVE') ??
    recruitments?.[0] ??
    null

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Staff Recruitment</h1>
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
          { label: 'Active Recruitments', value: summary?.activeRecruitments ?? '–', tone: 'positive' },
          { label: 'Applications Received', value: summary?.applicationsReceived ?? '–' },
          { label: 'Interviews Scheduled', value: summary?.interviewsScheduled ?? '–', tone: 'info' },
          { label: 'Offers Sent', value: summary?.offersSent ?? '–' },
          { label: 'Hired Candidates', value: summary?.hiredCandidates ?? '–', tone: 'positive' },
        ]}
      />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by role" />
        <Tabs
          ariaLabel="Filter by status"
          value={status}
          onChange={setStatus}
          options={[{ value: '', label: 'All' }, ...toOptions(RECRUITMENT_STATUS)]}
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : recruitments.length === 0 ? (
        <EmptyState title="No recruitments yet" description="Create your first recruitment posting." />
      ) : (
        <>
          <div className="card">
            <ul className="list">
              {recruitments.map((r) => (
                <li
                  key={r.id}
                  className={`is-selectable${r.id === selected?.id ? ' is-selected' : ''}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <div className="grow">
                    <b>{r.role}</b>
                    <small>{describeRole(r)}</small>
                  </div>
                  <span className="none">
                    {r.totalCandidates} candidate{r.totalCandidates === 1 ? '' : 's'}
                    {r.hired > 0 && `, ${r.hired} hired`}
                  </span>
                  <StatusBadge value={r.status} label={RECRUITMENT_STATUS[r.status]} />
                  <div onClick={(e) => e.stopPropagation()}>
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
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {selected && <RecruitmentPipeline recruitmentId={selected.id} />}
        </>
      )}

      {creating && <CreateRecruitmentModal onClose={() => setCreating(false)} />}
    </div>
  )
}
