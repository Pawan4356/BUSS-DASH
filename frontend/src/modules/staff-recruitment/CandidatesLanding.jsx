import { useNavigate } from 'react-router-dom'
import { DetailHeader, EmptyState, TableSkeleton } from '../../shared/components'
import { useListRecruitmentsQuery } from './api'

export function CandidatesLanding() {
  const navigate = useNavigate()
  const { data: recruitments, isLoading } = useListRecruitmentsQuery({ status: 'ACTIVE' })

  return (
    <div>
      <DetailHeader backTo="/staff-recruitment" backLabel="Staff Recruitment" title="Candidate Applications" mode="view" />

      {isLoading ? (
        <TableSkeleton />
      ) : recruitments.length === 0 ? (
        <EmptyState title="No launched recruitments" description="Launch a recruitment to start collecting candidates." />
      ) : (
        <div className="summary-grid">
          {recruitments.map((r) => (
            <button
              key={r.id}
              type="button"
              className="card stat-tile"
              onClick={() => navigate(r.id)}
              style={{ cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ fontWeight: 600 }}>{r.role}</div>
              <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                {r.totalCandidates} candidates · {r.hired} hired
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
