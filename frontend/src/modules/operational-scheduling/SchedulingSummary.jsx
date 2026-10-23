import { useState } from 'react'
import { useSelector } from 'react-redux'
import { PersonCell, StatusBadge, SummaryStats, TableSkeleton } from '../../shared/components'
import { ASSIGNMENT_STATUS } from '../../shared/ui-tags'
import { dayKey } from '../../shared/time'
import { useGetSchedulingListQuery, useGetSchedulingSummaryQuery, useGetSchedulingTrendQuery } from './api'
import { flattenAssignments } from './flattenAssignments'
import { WorkloadBars } from './WorkloadBars'
import { WorkloadChart } from './WorkloadChart'
import { TrendSparkline } from './TrendSparkline'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function SchedulingSummary() {
  const [date, setDate] = useState(today())
  const flags = useSelector((s) => s.auth.flags)
  const { data, isLoading } = useGetSchedulingSummaryQuery(date)
  const { data: trend } = useGetSchedulingTrendQuery(date.slice(0, 7))
  const { data: list } = useGetSchedulingListQuery(date)

  if (isLoading || !data) return <TableSkeleton rows={4} cols={3} />

  return (
    <div>
      <h2 className="section-title">Today</h2>
      <SummaryStats
        stats={[
          { label: 'Staff Scheduled', value: `${data.today.totalStaffScheduled - data.today.availableStaff}/${data.today.totalStaffScheduled}` },
          { label: 'Workspace Assignments', value: `${data.today.totalWorkspaceAssignments - data.today.availableWorkspaces}/${data.today.totalWorkspaceAssignments}` },
          { label: 'Resource Assignments', value: `${data.today.totalResourceAssignments - data.today.availableResources}/${data.today.totalResourceAssignments}` },
          { label: 'Active Assignments', value: data.today.activeAssignments, tone: 'positive' },
          { label: 'Upcoming Assignments', value: data.today.upcomingAssignments, tone: 'info' },
          { label: 'Completed Assignments', value: data.today.completedAssignments },
        ]}
      />

      <div className="grid-2">
        <section>
          <div className="section-head">
            <h2 className="section-title">Assignments</h2>
            <span>{date === today() ? 'Today' : new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</span>
          </div>
          <div className="card">
            <AssignmentsList items={list ? flattenAssignments(list) : null} date={date} />
          </div>
        </section>
        <section>
          <div className="section-head">
            <h2 className="section-title">Workload</h2>
            <span>Assigned hours per person</span>
          </div>
          <div className="card">
            <WorkloadBars staff={data.breakdown.staff} />
          </div>
        </section>
      </div>

      {flags?.operationalSchedulingPremium && data.workload && (
        <>
          <h2 className="section-title">Today's Workload</h2>
          <div className="card" style={{ padding: 16, marginBottom: 24 }}>
            <WorkloadChart hours={data.workload.hours} peakHour={data.workload.peakHour} />
          </div>
        </>
      )}

      <div className="cluster" style={{ justifyContent: 'space-between' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Breakdown for
        </h2>
        <input type="date" className="input" style={{ maxWidth: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <BreakdownTable
        title="Staff"
        rows={data.breakdown.staff}
        columns={[
          ['name', 'Name'],
          ['assignedHours', 'Assigned Hrs'],
          ['idleHours', 'Idle Hrs'],
          ['utilizationPct', 'Utilization %'],
          ['overtimeHours', 'Overtime Hrs'],
        ]}
      />
      <BreakdownTable
        title="Workspaces"
        rows={data.breakdown.workspaces}
        columns={[
          ['name', 'Name'],
          ['occupiedHours', 'Occupied Hrs'],
          ['freeHours', 'Free Hrs'],
          ['utilizationPct', 'Utilization %'],
          ['usageCount', 'Usage Count'],
        ]}
      />
      <BreakdownTable
        title="Resources"
        rows={data.breakdown.resources}
        columns={[
          ['name', 'Name'],
          ['usageHours', 'Usage Hrs'],
          ['downtimeHours', 'Downtime Hrs'],
          ['maintenanceHours', 'Maintenance Hrs'],
          ['utilizationPct', 'Utilization %'],
        ]}
      />

      {trend && (
        <>
          <h2 className="section-title">Monthly Usage Trend</h2>
          <div className="card" style={{ padding: 16 }}>
            <TrendSparkline label="Staff Hours" points={trend.points} valueKey="staffHours" color="var(--ocean)" />
            <TrendSparkline label="Workspace Hours" points={trend.points} valueKey="workspaceHours" color="var(--mint)" />
            <TrendSparkline label="Resource Hours" points={trend.points} valueKey="resourceHours" color="var(--sun)" />
          </div>
        </>
      )}
    </div>
  )
}

function BreakdownTable({ title, rows, columns }) {
  if (rows.length === 0) return null
  return (
    <>
      <h2 className="section-title">{title}</h2>
      <div className="table-wrap card" style={{ marginBottom: 24 }}>
        <table className="table">
          <thead>
            <tr>
              {columns.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map(([key]) => (
                  <td key={key}>{row[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function AssignmentsList({ items, date }) {
  if (!items) return <div style={{ padding: 16 }}><TableSkeleton rows={3} cols={3} /></div>
  if (items.length === 0) return <p className="none" style={{ padding: 16, margin: 0 }}>Nothing assigned for this day.</p>
  const key = dayKey(new Date(`${date}T00:00:00`))
  return (
    <ul className="list">
      {items.map((a) => {
        const windows = (a.timeWindows ?? []).filter((w) => w.dayOfWeek === key)
        return (
          <li key={a.id}>
            <div className="grow">
              <PersonCell name={a.staffName} subtitle={`${a.what}, ${a.where}`} fallback="Unassigned" />
            </div>
            <span className="none">
              {a.dedicated ? 'Dedicated' : windows.map((w) => `${w.startTime} – ${w.endTime}`).join(', ') || 'All day'}
            </span>
            {a.status && <StatusBadge value={a.status} label={ASSIGNMENT_STATUS[a.status]} />}
          </li>
        )
      })}
    </ul>
  )
}
