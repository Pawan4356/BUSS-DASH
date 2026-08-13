import { useState } from 'react'
import { useSelector } from 'react-redux'
import { SummaryStats, TableSkeleton } from '../../shared/components'
import { useGetSchedulingSummaryQuery, useGetSchedulingTrendQuery } from './api'
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

  if (isLoading || !data) return <TableSkeleton rows={4} cols={3} />

  return (
    <div>
      <h2 className="section-title">Today</h2>
      <SummaryStats
        stats={[
          { label: 'Staff Scheduled', value: `${data.today.totalStaffScheduled - data.today.availableStaff}/${data.today.totalStaffScheduled}` },
          { label: 'Workspace Assignments', value: `${data.today.totalWorkspaceAssignments - data.today.availableWorkspaces}/${data.today.totalWorkspaceAssignments}` },
          { label: 'Resource Assignments', value: `${data.today.totalResourceAssignments - data.today.availableResources}/${data.today.totalResourceAssignments}` },
          { label: 'Active Assignments', value: data.today.activeAssignments },
          { label: 'Upcoming Assignments', value: data.today.upcomingAssignments },
          { label: 'Completed Assignments', value: data.today.completedAssignments },
        ]}
      />

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
            <TrendSparkline label="Staff Hours" points={trend.points} valueKey="staffHours" />
            <TrendSparkline label="Workspace Hours" points={trend.points} valueKey="workspaceHours" />
            <TrendSparkline label="Resource Hours" points={trend.points} valueKey="resourceHours" />
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
