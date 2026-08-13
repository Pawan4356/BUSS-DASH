import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { DetailHeader, EmptyState, StatusBadge, TableSkeleton } from '../../shared/components'
import { ATTENDANCE_STATUS } from '../../shared/ui-tags'
import { useGetAttendanceHistoryQuery } from './api'
import { isoToTimeInput } from './timeAdapters'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function AttendanceHistory() {
  const { staffId } = useParams()
  const [month, setMonth] = useState(currentMonth())
  const { data: records, isLoading } = useGetAttendanceHistoryQuery({ staffId, month })

  return (
    <div>
      <DetailHeader backTo="/staff-attendance" backLabel="Staff Attendance" title="Attendance History" mode="view" />

      <div className="toolbar">
        <input type="month" className="input" style={{ maxWidth: 170 }} value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : records.length === 0 ? (
        <EmptyState title="No attendance records for this month" />
      ) : (
        <div className="table-wrap card">
          <table className="table">
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
                  <td>{r.date}</td>
                  <td>{isoToTimeInput(r.checkIn) || '—'}</td>
                  <td>{isoToTimeInput(r.checkOut) || '—'}</td>
                  <td>
                    <StatusBadge value={r.status} label={ATTENDANCE_STATUS[r.status]} />
                  </td>
                  <td>{r.stayTimeMinutes != null ? `${Math.floor(r.stayTimeMinutes / 60)}h ${r.stayTimeMinutes % 60}m` : '—'}</td>
                  <td className="text-muted">
                    {[r.lateCheckIn && 'Late check-in', r.earlyCheckOut && 'Early check-out'].filter(Boolean).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
