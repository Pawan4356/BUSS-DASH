import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DatePicker,
  EmptyState,
  KebabMenu,
  PersonCell,
  rowClick,
  SearchInput,
  StatusBadge,
  SummaryStats,
  TableSkeleton,
  Tabs,
  useToast,
} from '../../shared/components'
import { ATTENDANCE_STATUS, toOptions } from '../../shared/ui-tags'
import { FLAGS } from '../../shared/flags'
import { useCanManage } from '../../shared/permissions'
import { useGetAttendanceRegisterQuery, useGetAttendanceSummaryQuery, useUpdateAttendanceMutation } from './api'
import { isoToTimeInput, timeInputToIso } from './timeAdapters'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function AttendanceRegister() {
  const [date, setDate] = useState(today())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [editingId, setEditingId] = useState(null)
  const navigate = useNavigate()
  const { push } = useToast()
  const canManage = useCanManage(FLAGS.STAFF_ATTENDANCE)

  const { data: summary, isLoading: summaryLoading } = useGetAttendanceSummaryQuery()
  const { data, isLoading, isFetching } = useGetAttendanceRegisterQuery({
    date,
    search: search || undefined,
    status: status || undefined,
  })
  const [updateAttendance] = useUpdateAttendanceMutation()

  async function handleFieldChange(row, field, value) {
    try {
      await updateAttendance({
        staffId: row.staffId,
        date,
        [field]: field === 'status' ? value : timeInputToIso(date, value),
      }).unwrap()
    } catch {
      push('Could not update attendance', { tone: 'danger' })
    }
  }

  const rows = data?.rows ?? []

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Staff Attendance</h1>
        <DatePicker value={date} onChange={setDate} ariaLabel="Date" />
      </div>

      <SummaryStats
        loading={summaryLoading}
        stats={[
          { label: 'Total Staff', value: summary?.totalStaff ?? '–' },
          { label: 'Present Today', value: summary?.presentToday ?? '–', tone: 'positive' },
          { label: 'Absent Today', value: summary?.absentToday ?? '–', tone: 'danger' },
          { label: 'On Leave', value: summary?.onLeave ?? '–', tone: 'warning' },
          { label: 'Off Today', value: summary?.offToday ?? '–' },
          { label: 'Late Check-ins', value: summary?.lateCheckIns ?? '–', tone: 'warning' },
          { label: 'Early Check-outs', value: summary?.earlyCheckOuts ?? '–', tone: 'warning' },
        ]}
      />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search staff" />
        <Tabs
          ariaLabel="Filter by status"
          value={status}
          onChange={setStatus}
          options={[{ value: '', label: 'All' }, ...toOptions(ATTENDANCE_STATUS)]}
        />
      </div>

      {!status && !search && rows.length > 0 && <DayComposition rows={rows} />}

      {isLoading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="No staff match these filters" />
      ) : (
        <div className="table-wrap card">
          <table className="table" style={{ opacity: isFetching ? 0.6 : 1 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Shift</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Flags</th>
                <th>Stay</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
                canManage && editingId === row.staffId ? (
                  <EditRow key={row.staffId} row={row} onChange={handleFieldChange} onDone={() => setEditingId(null)} />
                ) : (
                  <tr key={row.staffId} className="is-clickable" onClick={rowClick(() => navigate(`${row.staffId}/history`))}>
                    <td>
                      <PersonCell
                        name={row.name}
                        subtitle={row.title}
                        fallback="—"
                        onOpen={() => navigate(`${row.staffId}/history`)}
                      />
                    </td>
                    <td className="today-cell">{shiftLabel(row)}</td>
                    <td>{row.checkIn ? isoToTimeInput(row.checkIn) : <span className="none">—</span>}</td>
                    <td>{row.checkOut ? isoToTimeInput(row.checkOut) : <span className="none">—</span>}</td>
                    <td>
                      <Flags row={row} />
                    </td>
                    <td>{stayLabel(row)}</td>
                    <td>
                      <StatusBadge value={row.status} label={ATTENDANCE_STATUS[row.status]} />
                    </td>
                    <td>
                      <KebabMenu
                        items={[
                          ...(canManage ? [{ label: 'Mark attendance', onClick: () => setEditingId(row.staffId) }] : []),
                          { label: 'History', onClick: () => navigate(`${row.staffId}/history`) },
                        ]}
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function shiftLabel(row) {
  if (row.workingSchedule.length === 0) return <span className="none">No schedule</span>
  if (row.workingSchedule[0].isOff) return <span className="none">Off today</span>
  return row.workingSchedule.map((w) => `${w.start} – ${w.end}`).join(', ')
}

function stayLabel(row) {
  return row.stayTimeMinutes != null ? `${Math.floor(row.stayTimeMinutes / 60)}h ${row.stayTimeMinutes % 60}m` : <span className="none">—</span>
}

function Flags({ row }) {
  if (!row.lateCheckIn && !row.earlyCheckOut) return <span className="none">—</span>
  return (
    <div className="chips">
      {row.lateCheckIn && <span className="chip chip-warn">Late check-in</span>}
      {row.earlyCheckOut && <span className="chip">Early check-out</span>}
    </div>
  )
}

/** Inline editor for one register row — times and status save on change. */
function EditRow({ row, onChange, onDone }) {
  return (
    <tr className="is-editing">
      <td>
        <PersonCell name={row.name} subtitle={row.title} fallback="—" />
      </td>
      <td className="today-cell">{shiftLabel(row)}</td>
      <td>
        <input
          type="time"
          className="input"
          style={{ width: 110 }}
          aria-label="Check in"
          defaultValue={isoToTimeInput(row.checkIn)}
          onBlur={(e) => e.target.value !== isoToTimeInput(row.checkIn) && onChange(row, 'checkIn', e.target.value)}
        />
      </td>
      <td>
        <input
          type="time"
          className="input"
          style={{ width: 110 }}
          aria-label="Check out"
          defaultValue={isoToTimeInput(row.checkOut)}
          onBlur={(e) => e.target.value !== isoToTimeInput(row.checkOut) && onChange(row, 'checkOut', e.target.value)}
        />
      </td>
      <td>
        <Flags row={row} />
      </td>
      <td>{stayLabel(row)}</td>
      <td>
        <select className="select" style={{ width: 120 }} aria-label="Status" value={row.status} onChange={(e) => onChange(row, 'status', e.target.value)}>
          {toOptions(ATTENDANCE_STATUS).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <button type="button" className="btn btn-sm btn-primary" onClick={onDone}>
          Done
        </button>
      </td>
    </tr>
  )
}

const COMPOSITION = [
  ['present', 'On time', 'var(--mint)'],
  ['late', 'Late', 'var(--sun)'],
  ['leave', 'Leave', 'color-mix(in srgb, var(--sun) 45%, var(--surface))'],
  ['absent', 'Absent', 'var(--coral)'],
  ['off', 'Off', 'var(--border)'],
]

/** One stacked bar: how the selected day's register breaks down. */
function DayComposition({ rows }) {
  const counts = { present: 0, late: 0, leave: 0, absent: 0, off: 0 }
  for (const r of rows) {
    if (r.status === 'PRESENT') counts[r.lateCheckIn ? 'late' : 'present'] += 1
    else if (r.status === 'LEAVE') counts.leave += 1
    else if (r.status === 'OFF') counts.off += 1
    else counts.absent += 1
  }
  const total = rows.length
  return (
    <section className="card floor" aria-label="Day breakdown">
      <div className="floor-top">
        <h2 className="section-title">The day at a glance</h2>
        <div className="tally">
          <span>
            <b>{counts.present + counts.late}</b>of {total} present
          </span>
          <span>
            <b>{counts.absent}</b>absent
          </span>
        </div>
      </div>
      <div className="composition" role="img" aria-label={COMPOSITION.map(([k, l]) => `${l} ${counts[k]}`).join(', ')}>
        {COMPOSITION.filter(([k]) => counts[k] > 0).map(([k, l, color]) => (
          <span key={k} style={{ flex: counts[k], background: color }} title={`${l}: ${counts[k]}`} />
        ))}
      </div>
      <div className="legend" style={{ marginLeft: 0, marginTop: 10 }}>
        {COMPOSITION.map(([k, l, color]) => (
          <span key={k}>
            <i style={{ background: color, width: 10, height: 10 }} />
            {l} {counts[k]}
          </span>
        ))}
      </div>
    </section>
  )
}
