import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { DetailHeader, EmptyState, KebabMenu, StatusBadge, TableSkeleton } from '../../shared/components'
import { CANDIDATE_STATUS } from '../../shared/ui-tags'
import { useGetRecruitmentQuery, useListCandidatesQuery } from './api'
import { AddCandidateModal } from './AddCandidateModal'

export function CandidateList() {
  const { recruitmentId } = useParams()
  const navigate = useNavigate()
  const business = useSelector((s) => s.auth.business)
  const { data: recruitment } = useGetRecruitmentQuery(recruitmentId)
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
        {showB2C && (
          <button type="button" className={`btn ${tab === 'B2C' ? 'btn-primary' : ''}`} onClick={() => setTab('B2C')}>
            B2C Applicant
          </button>
        )}
        {showWalkIn && (
          <button type="button" className={`btn ${tab === 'WALK_IN' ? 'btn-primary' : ''}`} onClick={() => setTab('WALK_IN')}>
            Walk-in Applicant
          </button>
        )}
        <div className="toolbar-spacer" />
        {showWalkIn && (
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
                <th>Account ID</th>
                <th>Name</th>
                <th>Experience</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td>{c.accountId ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => navigate(c.id)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                    >
                      {c.name}
                    </button>
                  </td>
                  <td>{c.experience ?? '—'}</td>
                  <td>{new Date(c.appliedDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge value={c.status} label={CANDIDATE_STATUS[c.status]} />
                  </td>
                  <td>
                    <KebabMenu
                      items={[
                        { label: 'View', onClick: () => navigate(c.id) },
                        ...(c.source === 'WALK_IN' ? [{ label: 'Edit', onClick: () => navigate(c.id, { state: { startInEdit: true } }) }] : []),
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
