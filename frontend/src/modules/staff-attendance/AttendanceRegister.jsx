import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, SummaryStats, TableSkeleton, useToast } from '../../shared/components'
import { ATTENDANCE_STATUS, toOptions } from '../../shared/ui-tags'
import { useGetAttendanceRegisterQuery, useGetAttendanceSummaryQuery, useUpdateAttendanceMutation } from './api'
import { isoToTimeInput, timeInputToIso } from './timeAdapters'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function AttendanceRegister() {
  const [date, setDate] = useState(today())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()
  const { push } = useToast()

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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Staff Attendance</h1>
      </div>

      <SummaryStats
        loading={summaryLoading}
        stats={[
          { label: 'Total Staff', value: summary?.totalStaff ?? '–' },
          { label: 'Present Today', value: summary?.presentToday ?? '–' },
          { label: 'Absent Today', value: summary?.absentToday ?? '–' },
          { label: 'On Leave', value: summary?.onLeave ?? '–' },
          { label: 'Off Today', value: summary?.offToday ?? '–' },
          { label: 'Late Check-ins', value: summary?.lateCheckIns ?? '–' },
          { label: 'Early Check-outs', value: summary?.earlyCheckOuts ?? '–' },
        ]}
      />

      <div className="toolbar">
        <input type="date" className="input" style={{ maxWidth: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" style={{ maxWidth: 220 }} placeholder="Search staff…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" style={{ maxWidth: 170 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {toOptions(ATTENDANCE_STATUS).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : data.rows.length === 0 ? (
        <EmptyState title="No staff match these filters" />
      ) : (
        <div className="table-wrap card">
          <table className="table" style={{ opacity: isFetching ? 0.6 : 1 }}>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Working Schedule</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
                <th>Stay Time</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.staffId}>
                  <td>{row.name ?? '—'}</td>
                  <td className="text-muted">
                    {row.workingSchedule.length === 0
                      ? 'No schedule'
                      : row.workingSchedule[0].isOff
                        ? 'Off'
                        : row.workingSchedule.map((w) => `${w.start}–${w.end}`).join(', ')}
                  </td>
                  <td>
                    <input
                      type="time"
                      className="input"
                      style={{ width: 110 }}
                      value={isoToTimeInput(row.checkIn)}
                      onChange={(e) => handleFieldChange(row, 'checkIn', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="input"
                      style={{ width: 110 }}
                      value={isoToTimeInput(row.checkOut)}
                      onChange={(e) => handleFieldChange(row, 'checkOut', e.target.value)}
                    />
                  </td>
                  <td>
                    <select className="select" style={{ width: 120 }} value={row.status} onChange={(e) => handleFieldChange(row, 'status', e.target.value)}>
                      {toOptions(ATTENDANCE_STATUS).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{row.stayTimeMinutes != null ? `${Math.floor(row.stayTimeMinutes / 60)}h ${row.stayTimeMinutes % 60}m` : '—'}</td>
                  <td>
                    <button type="button" className="btn btn-sm" onClick={() => navigate(`${row.staffId}/history`)}>
                      History
                    </button>
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
