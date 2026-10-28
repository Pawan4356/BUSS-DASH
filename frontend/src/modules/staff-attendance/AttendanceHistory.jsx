import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Avatar, DatePicker, DetailHeader, EmptyState, NotFound, StatusBadge, TableSkeleton, Tabs } from '../../shared/components'
import { ATTENDANCE_STATUS, DAY_OF_WEEK_SHORT } from '../../shared/ui-tags'
import { todayIso } from '../../shared/time'
import { useGetAttendanceHistoryQuery, useGetAttendanceMonthsQuery } from './api'
import { useGetStaffQuery } from '../staff-directory/api'
import { isoToTimeInput } from './timeAdapters'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function stayLabel(minutes) {
  return minutes != null ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : null
}

/** Tone for a day: late check-ins get their own colour even though status is PRESENT. */
function dayTone(r) {
  if (r.status === 'PRESENT') return r.lateCheckIn ? 'late' : 'present'
  return r.status.toLowerCase()
}

export function AttendanceHistory() {
  const { staffId } = useParams()
  const flags = useSelector((s) => s.auth.flags)
  const [month, setMonth] = useState(currentMonth())
  const [view, setView] = useState('calendar')
  const { data: records, isLoading, error: loadError } = useGetAttendanceHistoryQuery({ staffId, month })
  const { data: monthsWithData } = useGetAttendanceMonthsQuery(staffId)
  // The person's name comes from the directory, when the business has it.
  const { data: staff } = useGetStaffQuery(staffId, { skip: !flags?.staffDirectory })

  if (loadError?.status === 404) {
    return (
      <NotFound
        title="Staff member not found"
        description="There’s no attendance history for this person — they may have been removed."
        backTo="/staff-attendance"
        backLabel="Back to Staff Attendance"
      />
    )
  }

  const name = staff ? [staff.firstName, staff.lastName].filter(Boolean).join(' ') : null

  return (
    <div>
      <DetailHeader
        backTo="/staff-attendance"
        backLabel="Staff Attendance"
        title={name ?? 'Attendance History'}
        leading={name ? <Avatar name={name} size={52} /> : undefined}
        subtitle={name ? ['Attendance history', staff.title].filter(Boolean).join(' · ') : undefined}
        mode="view"
      />

      <div className="toolbar">
        <DatePicker mode="month" value={month} onChange={setMonth} enabledMonths={monthsWithData} ariaLabel="Month" />
        {records?.length > 0 && <MonthStats records={records} />}
        <div className="toolbar-spacer" />
        <Tabs
          ariaLabel="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'calendar', label: 'Calendar' },
            { value: 'list', label: 'List' },
          ]}
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : records.length === 0 ? (
        <EmptyState title="No attendance records for this month" />
      ) : view === 'calendar' ? (
        <MonthCalendar month={month} records={records} />
      ) : (
        <HistoryList records={records} />
      )}
    </div>
  )
}

function MonthStats({ records }) {
  const count = (fn) => records.filter(fn).length
  const totalMinutes = records.reduce((sum, r) => sum + (r.stayTimeMinutes ?? 0), 0)
  const stats = [
    ['present', 'On time', count((r) => r.status === 'PRESENT' && !r.lateCheckIn)],
    ['late', 'Late', count((r) => r.status === 'PRESENT' && r.lateCheckIn)],
    ['absent', 'Absent', count((r) => r.status === 'ABSENT')],
    ['leave', 'Leave', count((r) => r.status === 'LEAVE')],
    ['off', 'Off', count((r) => r.status === 'OFF')],
  ]
  const early = count((r) => r.earlyCheckOut)
  return (
    <div className="history-stats">
      {stats.map(([tone, label, n]) => (
        <span key={tone} className={`history-stat tone-${tone}`}>
          <i />
          <b>{n}</b> {label}
        </span>
      ))}
      {early > 0 && (
        <span className="history-stat">
          <b>{early}</b> early out
        </span>
      )}
      <span className="history-stat">
        <b>{Math.round(totalMinutes / 60)}h</b> worked
      </span>
    </div>
  )
}

/** The month as a Mon–Sun grid; each day is a small tile coloured by status. */
function MonthCalendar({ month, records }) {
  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const leadingBlanks = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7 // Monday-first
  const byDate = new Map(records.map((r) => [r.date, r]))
  const today = todayIso()

  return (
    <div className="card history-cal">
      {Object.values(DAY_OF_WEEK_SHORT).map((d) => (
        <div key={d} className="history-cal-dow">
          {d}
        </div>
      ))}
      {Array.from({ length: leadingBlanks }, (_, i) => (
        <div key={`blank-${i}`} aria-hidden="true" />
      ))}
      {Array.from({ length: daysInMonth }, (_, i) => {
        const date = `${month}-${String(i + 1).padStart(2, '0')}`
        const r = byDate.get(date)
        const tone = r ? dayTone(r) : 'none'
        const times = r?.checkIn ? `${isoToTimeInput(r.checkIn)}–${isoToTimeInput(r.checkOut) || '…'}` : null
        const label = r ? (tone === 'late' ? 'Late' : ATTENDANCE_STATUS[r.status]) : date > today ? '' : 'No record'
        return (
          <div
            key={date}
            className={`history-day tone-${tone}${date === today ? ' is-today' : ''}`}
            title={r ? [date, label, times, stayLabel(r.stayTimeMinutes), r.earlyCheckOut && 'early check-out'].filter(Boolean).join(' · ') : date}
          >
            <div className="history-day-top">
              <b>{i + 1}</b>
              <span>{label}</span>
            </div>
            {times && <span className="history-day-times">{times}</span>}
            {r?.stayTimeMinutes != null && (
              <span className="history-day-stay">
                {stayLabel(r.stayTimeMinutes)}
                {r.earlyCheckOut && <em> · early</em>}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HistoryList({ records }) {
  return (
    <div className="table-wrap card">
      <table className="table table-compact">
        <thead>
          <tr>
            <th>Date</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Status</th>
            <th>Stay Time</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.date}>
              <td>
                {new Date(`${r.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
              </td>
              <td>{isoToTimeInput(r.checkIn) || '—'}</td>
              <td>{isoToTimeInput(r.checkOut) || '—'}</td>
              <td>
                <StatusBadge value={r.status} label={ATTENDANCE_STATUS[r.status]} />
              </td>
              <td>{stayLabel(r.stayTimeMinutes) ?? '—'}</td>
              <td className="text-muted">
                {[r.lateCheckIn && 'Late check-in', r.earlyCheckOut && 'Early check-out'].filter(Boolean).join(', ') || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
