import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { DetailHeader, EmptyState, KebabMenu, NotFound, PersonCell, StatusBadge, TableSkeleton, Tabs } from '../../shared/components'
import { CANDIDATE_STATUS } from '../../shared/ui-tags'
import { FLAGS } from '../../shared/flags'
import { useCanManage } from '../../shared/permissions'
import { useGetRecruitmentQuery, useListCandidatesQuery } from './api'
import { AddCandidateModal } from './AddCandidateModal'

export function CandidateList() {
  const { recruitmentId } = useParams()
  const navigate = useNavigate()
  const business = useSelector((s) => s.auth.business)
  const canManage = useCanManage(FLAGS.STAFF_RECRUITMENT)
  const { data: recruitment, error: loadError } = useGetRecruitmentQuery(recruitmentId)
  const [adding, setAdding] = useState(false)

  const audience = recruitment?.audience ?? (business.recruitmentModelType === 'BOTH' ? null : business.recruitmentModelType)
  const showB2C = audience === 'B2C' || audience === null
  const showWalkIn = audience === 'INTERNAL' || audience === null
  const [tab, setTab] = useState(null)

  useEffect(() => {
    if (!tab && (showB2C || showWalkIn)) setTab(showB2C ? 'B2C' : 'WALK_IN')
  }, [showB2C, showWalkIn, tab])

  const { data: candidates, isLoading } = useListCandidatesQuery(
    { recruitmentId, source: tab },
    { skip: !tab },
  )

  if (loadError?.status === 404) {
    return (
      <NotFound
        title="Recruitment not found"
        description="This job opening may have been deleted, or the link is incorrect."
        backTo="/staff-recruitment/candidates"
        backLabel="Back to Candidates"
      />
    )
  }
  if (!recruitment || !tab) return <TableSkeleton />

  return (
    <div>
      <DetailHeader
        backTo="/staff-recruitment/candidates"
        backLabel="Candidate Applications"
        title={recruitment.role}
        mode="view"
      />

      <div className="toolbar">
        <Tabs
          ariaLabel="Applicant source"
          value={tab}
          onChange={setTab}
          options={[
            ...(showB2C ? [{ value: 'B2C', label: 'B2C Applicant' }] : []),
            ...(showWalkIn ? [{ value: 'WALK_IN', label: 'Walk-in Applicant' }] : []),
          ]}
        />
        <div className="toolbar-spacer" />
        {canManage && showWalkIn && (
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            + Add Candidate
          </button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : candidates.length === 0 ? (
        <EmptyState title="No candidates yet" />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Account ID</th>
                <th>Experience</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td>
                    <PersonCell name={c.name} onOpen={() => navigate(c.id)} />
                  </td>
                  <td>{c.accountId ?? '—'}</td>
                  <td>{c.experience ?? '—'}</td>
                  <td>{new Date(c.appliedDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge value={c.status} label={CANDIDATE_STATUS[c.status]} />
                  </td>
                  <td>
                    <KebabMenu
                      items={[
                        { label: 'View', onClick: () => navigate(c.id) },
                        ...(canManage && c.source === 'WALK_IN' ? [{ label: 'Edit', onClick: () => navigate(c.id, { state: { startInEdit: true } }) }] : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && <AddCandidateModal recruitmentId={recruitmentId} onClose={() => setAdding(false)} />}
    </div>
  )
}
