import { useState } from 'react'
import { Modal, RepeatPatternPicker, TimeWindowPicker, emptyWeeklySchedule, useToast } from '../../shared/components'
import { useCreateAssignmentMutation } from './api'

function scheduleToWindows(schedule) {
  return Object.entries(schedule).flatMap(([dayOfWeek, day]) =>
    day.isOff ? [] : day.windows.map((w) => ({ dayOfWeek, startTime: w.start, endTime: w.end })),
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function AssignModal({ workspaceId, resourceId, staffOptions, onClose }) {
  const [staffIds, setStaffIds] = useState([])
  const [schedule, setSchedule] = useState(emptyWeeklySchedule())
  const [repeat, setRepeat] = useState({ pattern: 'NONE', interval: 1, startDate: today(), endDate: '' })
  const [note, setNote] = useState('')
  const [conflicts, setConflicts] = useState([])
  const [createAssignment, { isLoading }] = useCreateAssignmentMutation()
  const { push } = useToast()

  const timeWindows = scheduleToWindows(schedule)

  async function submit(force) {
    const targets = force ? conflicts.map((c) => c.staffId) : staffIds
    const nextConflicts = []
    let created = 0

    for (const staffId of targets) {
      try {
        await createAssignment({
          staffId,
          workspaceId: workspaceId ?? undefined,
          resourceId: resourceId ?? undefined,
          timeWindows,
          repeatPattern: repeat.pattern,
          repeatInterval: repeat.pattern === 'CUSTOM' ? repeat.interval : undefined,
          startDate: repeat.pattern === 'CUSTOM' ? repeat.startDate : today(),
          endDate: repeat.pattern === 'CUSTOM' && repeat.endDate ? repeat.endDate : undefined,
          note: note || undefined,
          forceAssign: force,
        }).unwrap()
        created += 1
      } catch (err) {
        const staffName = staffOptions.find((s) => s.id === staffId)?.name ?? staffId
        if (err.status === 409) {
          nextConflicts.push({ staffId, staffName, details: err.data?.detail?.conflicts ?? [] })
        } else {
          push(`Could not assign ${staffName}`, { tone: 'danger' })
        }
      }
    }

    if (created > 0) push(`Assigned ${created} staff member${created === 1 ? '' : 's'}`)
    if (nextConflicts.length > 0) {
      setConflicts(nextConflicts)
    } else {
      onClose()
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    submit(false)
  }

  return (
    <Modal title="Assign" onClose={onClose} width={520}>
      {conflicts.length === 0 ? (
        <form onSubmit={handleSubmit}>
          <div className="field">
            <span className="field-label">Staff</span>
            <div className="stack" style={{ maxHeight: 140, overflowY: 'auto' }}>
              {staffOptions.map((s) => (
                <label key={s.id} className="cluster" style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={staffIds.includes(s.id)}
                    onChange={(e) =>
                      setStaffIds(e.target.checked ? [...staffIds, s.id] : staffIds.filter((id) => id !== s.id))
                    }
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Weekly Time Windows</span>
            <TimeWindowPicker value={schedule} onChange={setSchedule} />
          </div>

          <div className="field">
            <span className="field-label">Repeat</span>
            <RepeatPatternPicker value={repeat} onChange={setRepeat} />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="assign-note">
              Note
            </label>
            <input id="assign-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="cluster" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || staffIds.length === 0 || timeWindows.length === 0}>
              {isLoading ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p>
            {conflicts.length} staff member{conflicts.length === 1 ? '' : 's'} already {conflicts.length === 1 ? 'has' : 'have'} an
            overlapping assignment:
          </p>
          <ul className="stack" style={{ fontSize: 13 }}>
            {conflicts.map((c) => (
              <li key={c.staffId}>
                <strong>{c.staffName}</strong>
                {c.details.map((d, i) => (
                  <div key={i} className="text-muted">
                    {d.dayOfWeek} {d.window.start}–{d.window.end} — currently assigned to {d.currentlyAssignedTo}
                  </div>
                ))}
              </li>
            ))}
          </ul>
          <div className="cluster" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>
              Skip Conflicted
            </button>
            <button type="button" className="btn btn-primary" onClick={() => submit(true)} disabled={isLoading}>
              Assign Anyway
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
