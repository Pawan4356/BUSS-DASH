import { useState } from 'react'
import { useSelector } from 'react-redux'
import { EmptyState, StatusBadge, TableSkeleton, useToast } from '../../shared/components'
import { ASSIGNMENT_STATUS } from '../../shared/ui-tags'
import { useCancelAssignmentMutation, useGetSchedulingListQuery } from './api'
import { AssignModal } from './AssignModal'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function SchedulingList() {
  const [date, setDate] = useState(today())
  const flags = useSelector((s) => s.auth.flags)
  const [tab, setTab] = useState('workspace')
  const { data, isLoading } = useGetSchedulingListQuery(date)
  const [assignTarget, setAssignTarget] = useState(null)
  const isPast = date < today()

  if (isLoading || !data) return <TableSkeleton />

  return (
    <div>
      <div className="cluster" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <button type="button" className={`btn ${tab === 'workspace' ? 'btn-primary' : ''}`} onClick={() => setTab('workspace')}>
            Workspace Resources
          </button>
          <button type="button" className={`btn ${tab === 'independent' ? 'btn-primary' : ''}`} onClick={() => setTab('independent')}>
            Independent Resources
          </button>
          {flags?.operationalSchedulingPremium && (
            <>
              <button type="button" className={`btn ${tab === 'staff' ? 'btn-primary' : ''}`} onClick={() => setTab('staff')}>
                Staff
              </button>
              <button type="button" className={`btn ${tab === 'quick' ? 'btn-primary' : ''}`} onClick={() => setTab('quick')}>
                Quick Assign
              </button>
            </>
          )}
        </div>
        <input type="date" className="input" style={{ maxWidth: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {tab === 'workspace' && (
        <WorkspaceResourcesTab data={data} isPast={isPast} onAssign={setAssignTarget} />
      )}
      {tab === 'independent' && (
        <ResourceCardsTab resources={data.independentResources} isPast={isPast} onAssign={setAssignTarget} />
      )}
      {tab === 'staff' && flags?.operationalSchedulingPremium && <StaffTab staff={data.staff ?? []} />}
      {tab === 'quick' && flags?.operationalSchedulingPremium && (
        <QuickAssignTab pickers={data.pickers} isPast={isPast} onAssign={setAssignTarget} />
      )}

      {assignTarget && (
        <AssignModal
          workspaceId={assignTarget.workspaceId}
          resourceId={assignTarget.resourceId}
          staffOptions={data.pickers.staff}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  )
}

function AssignmentRow({ a }) {
  const [cancelAssignment] = useCancelAssignmentMutation()
  const { push } = useToast()
  return (
    <div className="cluster" style={{ justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
      <span>
        {a.staffName} · {a.timeWindows.map((w) => `${w.dayOfWeek} ${w.startTime}-${w.endTime}`).join(', ')}
        {a.note && <span className="text-muted"> — {a.note}</span>}
      </span>
      <span className="cluster">
        <StatusBadge value={a.status} label={ASSIGNMENT_STATUS[a.status]} />
        <button
          type="button"
          className="btn btn-icon"
          aria-label="Cancel assignment"
          onClick={async () => {
            try {
              await cancelAssignment(a.id).unwrap()
              push('Assignment cancelled')
            } catch {
              push('Could not cancel assignment', { tone: 'danger' })
            }
          }}
        >
          ✕
        </button>
      </span>
    </div>
  )
}

function ResourceCard({ resource, isPast, onAssign }) {
  return (
    <div className="card" style={{ padding: 12, marginBottom: 8 }}>
      <div className="cluster" style={{ justifyContent: 'space-between' }}>
        <strong style={{ fontSize: 13 }}>{resource.name}</strong>
        {!isPast && (
          <button type="button" className="btn btn-sm" onClick={() => onAssign({ resourceId: resource.id })}>
            + Assign
          </button>
        )}
      </div>
      {resource.behavior === 'DEDICATED' ? (
        <p className="text-muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
          {resource.assignee ? `Dedicated to ${resource.assignee}` : 'Unassigned'}
        </p>
      ) : resource.assignments.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
          No assignments
        </p>
      ) : (
        resource.assignments.map((a) => <AssignmentRow a={a} key={a.id} />)
      )}
    </div>
  )
}

function WorkspaceResourcesTab({ data, isPast, onAssign }) {
  if (data.workspaceResources.length === 0) return <EmptyState title="No active workspaces" />
  return (
    <div className="stack">
      {data.workspaceResources.map((w) => (
        <div className="card" style={{ padding: 16 }} key={w.id}>
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <strong>{w.name}</strong>
            {!isPast && (
              <button type="button" className="btn btn-sm" onClick={() => onAssign({ workspaceId: w.id })}>
                + Assign
              </button>
            )}
          </div>
          {w.assignments.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>
              No assignments
            </p>
          ) : (
            w.assignments.map((a) => <AssignmentRow a={a} key={a.id} />)
          )}
          {w.resources.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {w.resources.map((r) => (
                <ResourceCard resource={r} isPast={isPast} onAssign={onAssign} key={r.id} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ResourceCardsTab({ resources, isPast, onAssign }) {
  if (resources.length === 0) return <EmptyState title="No independent resources" />
  return (
    <div>
      {resources.map((r) => (
        <ResourceCard resource={r} isPast={isPast} onAssign={onAssign} key={r.id} />
      ))}
    </div>
  )
}

function StaffTab({ staff }) {
  if (staff.length === 0) return <EmptyState title="No active staff" />
  return (
    <div className="stack">
      {staff.map((s) => (
        <div className="card" style={{ padding: 16 }} key={s.id}>
          <strong>{s.name}</strong>
          {s.schedule.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>
              No current schedule
            </p>
          ) : (
            s.schedule.map((a) => <AssignmentRow a={a} key={a.id} />)
          )}
        </div>
      ))}
    </div>
  )
}

function QuickAssignTab({ pickers, isPast, onAssign }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <p className="text-muted">Assign a staff member directly to a workspace or resource.</p>
      <div className="field-grid">
        <div className="field">
          <span className="field-label">Workspace</span>
          <select
            className="select"
            disabled={isPast}
            onChange={(e) => e.target.value && onAssign({ workspaceId: e.target.value })}
            defaultValue=""
          >
            <option value="" disabled>
              Select a workspace…
            </option>
            {pickers.workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="field-label">Resource</span>
          <select
            className="select"
            disabled={isPast}
            onChange={(e) => e.target.value && onAssign({ resourceId: e.target.value })}
            defaultValue=""
          >
            <option value="" disabled>
              Select a resource…
            </option>
            {pickers.resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
