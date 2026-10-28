import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog, KebabMenu, TableSkeleton, useToast } from '../../shared/components'
import { INTERVIEW_TYPE } from '../../shared/ui-tags'
import { FLAGS } from '../../shared/flags'
import { useCanManage } from '../../shared/permissions'
import {
  useGetRecruitmentQuery,
  useHireCandidateMutation,
  useLaunchRecruitmentMutation,
  useListCandidatesQuery,
  useUpdateCandidateMutation,
} from './api'
import { AddCandidateModal } from './AddCandidateModal'

const COLUMNS = [
  ['APPLIED', 'Applied', 'info'],
  ['SHORTLISTED', 'Shortlisted', 'warning'],
  ['HIRED', 'Hired', 'positive'],
  ['REJECTED', 'Rejected', 'danger'],
]

function shortDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : null
}

/**
 * The selected role's working view: interview rounds as a strip, then every
 * candidate on a four-column board. Cards move forward from their own menu.
 */
export function RecruitmentPipeline({ recruitmentId }) {
  const navigate = useNavigate()
  const { push } = useToast()
  const canManage = useCanManage(FLAGS.STAFF_RECRUITMENT)
  const { data: r } = useGetRecruitmentQuery(recruitmentId)
  const { data: candidates } = useListCandidatesQuery({ recruitmentId })
  const [updateCandidate] = useUpdateCandidateMutation()
  const [hireCandidate] = useHireCandidateMutation()
  const [launchRecruitment] = useLaunchRecruitmentMutation()
  const [adding, setAdding] = useState(false)
  const [pendingHire, setPendingHire] = useState(null)

  if (!r || !candidates) return <TableSkeleton rows={3} cols={4} />

  const canAddWalkIn = canManage && r.audience !== 'B2C' && r.status !== 'CLOSED'
  const openCandidate = (c) => navigate(`candidates/${r.id}/${c.id}`)

  async function move(c, status, label) {
    try {
      await updateCandidate({ id: c.id, status }).unwrap()
      push(`${c.name} ${label}`)
    } catch (err) {
      push(err.data?.message ?? 'Could not update candidate', { tone: 'danger' })
    }
  }

  async function confirmHire() {
    try {
      await hireCandidate(pendingHire.id).unwrap()
      push(`${pendingHire.name} hired — added to Staff Directory`)
    } catch (err) {
      push(err.data?.message ?? 'Could not hire candidate', { tone: 'danger' })
    } finally {
      setPendingHire(null)
    }
  }

  async function launch() {
    try {
      await launchRecruitment(r.id).unwrap()
      push('Recruitment launched')
    } catch (err) {
      push(err.data?.message ?? 'Could not launch', { tone: 'danger' })
    }
  }

  return (
    <section>
      <div className="section-head">
        <h2 className="section-title">{r.role}</h2>
        <span>{r.launchDate ? `Launched ${shortDate(r.launchDate)}` : 'Not launched'}</span>
        <div className="toolbar-spacer" />
        <div className="cluster">
          <button type="button" className="btn btn-sm" onClick={() => navigate(r.id)}>
            Settings
          </button>
          {canAddWalkIn && (
            <button type="button" className="btn btn-sm" onClick={() => setAdding(true)}>
              + Walk-in candidate
            </button>
          )}
        </div>
      </div>

      {r.interviewRounds.length > 0 && (
        <ul className="rounds">
          {r.interviewRounds.map((round) => (
            <li key={round.id}>
              <small className="none">
                Round {round.roundNumber}, {INTERVIEW_TYPE[round.type]}
              </small>
              <b>{[shortDate(round.date), round.time].filter(Boolean).join(', ') || 'Date to be set'}</b>
              <span className="none">{round.interviewerName ? `Interviewer ${round.interviewerName}` : 'No interviewer yet'}</span>
            </li>
          ))}
        </ul>
      )}

      {candidates.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-title">No candidates yet</div>
          <p>{r.status === 'INACTIVE' && canManage ? 'Launch this opening to start receiving applications.' : 'Applications will show up here.'}</p>
          {r.status === 'INACTIVE' ? (
            canManage && (
              <button type="button" className="btn btn-primary" onClick={launch}>
                Launch opening
              </button>
            )
          ) : (
            canAddWalkIn && (
              <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
                Add walk-in candidate
              </button>
            )
          )}
        </div>
      ) : (
        <div className="pipe">
          {COLUMNS.map(([key, label, tone]) => {
            const inColumn = candidates.filter((c) => c.status === key)
            return (
              <div key={key}>
                <h3>
                  {label}
                  <span className={`badge badge-${tone}`}>{inColumn.length}</span>
                </h3>
                {inColumn.map((c) => (
                  <div className="cand" key={c.id}>
                    <div className="cand-top">
                      <button type="button" className="row-link" onClick={() => openCandidate(c)}>
                        {c.name}
                      </button>
                      <KebabMenu
                        ariaLabel={`Actions for ${c.name}`}
                        items={[
                          { label: 'View', onClick: () => openCandidate(c) },
                          ...(canManage && c.status === 'APPLIED' ? [{ label: 'Shortlist', onClick: () => move(c, 'SHORTLISTED', 'shortlisted') }] : []),
                          ...(canManage && c.status === 'SHORTLISTED' ? [{ label: 'Hire', onClick: () => setPendingHire(c) }] : []),
                          ...(canManage && (c.status === 'APPLIED' || c.status === 'SHORTLISTED')
                            ? [{ label: 'Reject', danger: true, onClick: () => move(c, 'REJECTED', 'rejected') }]
                            : []),
                        ]}
                      />
                    </div>
                    <small>{c.experience ?? 'Experience not given'}</small>
                    <div className="cand-foot">
                      <span className="chip">{c.source === 'WALK_IN' ? 'Walk-in' : 'B2C'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {adding && <AddCandidateModal recruitmentId={r.id} onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={Boolean(pendingHire)}
        title={`Hire ${pendingHire?.name}?`}
        description="They'll be added to the Staff Directory as a new staff member."
        confirmLabel="Hire"
        onConfirm={confirmHire}
        onCancel={() => setPendingHire(null)}
      />
    </section>
  )
}
