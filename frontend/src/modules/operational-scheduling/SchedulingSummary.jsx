import { useState } from 'react'
import { useSelector } from 'react-redux'
import { DatePicker, PersonCell, ScrollArea, StatusBadge, SummaryStats, TableSkeleton, Tabs } from '../../shared/components'
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
          <ScrollArea className="card" maxHeight={420}>
            <AssignmentsList items={list ? flattenAssignments(list) : null} date={date} />
          </ScrollArea>
        </section>
        <section>
          <div className="section-head">
            <h2 className="section-title">Workload</h2>
            <span>Assigned hours per person</span>
          </div>
          <ScrollArea className="card" maxHeight={420}>
            <WorkloadBars staff={data.breakdown.staff} />
          </ScrollArea>
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

      <Breakdown breakdown={data.breakdown} date={date} onDateChange={setDate} />

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

const BREAKDOWN_VIEWS = {
  staff: {
    label: 'Staff',
    empty: 'No staff scheduled for this day.',
    columns: [
      ['assignedHours', 'Assigned Hrs'],
      ['idleHours', 'Idle Hrs'],
      ['overtimeHours', 'Overtime Hrs'],
    ],
  },
  workspaces: {
    label: 'Workspaces',
    empty: 'No workspaces in use for this day.',
    columns: [
      ['occupiedHours', 'Occupied Hrs'],
      ['freeHours', 'Free Hrs'],
      ['usageCount', 'Usage Count'],
    ],
  },
  resources: {
    label: 'Resources',
    empty: 'No resources in use for this day.',
    columns: [
      ['usageHours', 'Usage Hrs'],
      ['downtimeHours', 'Downtime Hrs'],
      ['maintenanceHours', 'Maintenance Hrs'],
    ],
  },
}

const COLLAPSED_ROWS = 8

/** Staff / Workspaces / Resources utilization in one card — one table at a time, busiest first. */
function Breakdown({ breakdown, date, onDateChange }) {
  const [view, setView] = useState('staff')
  const [expanded, setExpanded] = useState(false)
  const { columns, empty } = BREAKDOWN_VIEWS[view]
  const rows = [...breakdown[view]].sort((a, b) => b.utilizationPct - a.utilizationPct)
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS)

  function switchView(next) {
    setView(next)
    setExpanded(false)
  }

  return (
    <section>
      <div className="breakdown-head">
        <h2 className="section-title">Breakdown</h2>
        <Tabs
          ariaLabel="Breakdown by"
          value={view}
          onChange={switchView}
          options={Object.entries(BREAKDOWN_VIEWS).map(([value, v]) => ({
            value,
            label: v.label,
            count: breakdown[value].length,
          }))}
        />
        <div className="toolbar-spacer" />
        <DatePicker value={date} onChange={onDateChange} ariaLabel="Date" />
      </div>

      <div className="table-wrap card breakdown-card">
        {rows.length === 0 ? (
          <p className="none" style={{ padding: 16, margin: 0 }}>
            {empty}
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Utilization</th>
                {columns.map(([key, label]) => (
                  <th key={key} className="num">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={i}>
                  <td>{row.name ?? 'Unnamed'}</td>
                  <td>
                    <UtilizationBar pct={row.utilizationPct} />
                  </td>
                  {columns.map(([key]) => (
                    <td key={key} className="num">
                      {row[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length > COLLAPSED_ROWS && (
          <button type="button" className="breakdown-more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : `Show all ${rows.length}`}
          </button>
        )}
      </div>
    </section>
  )
}

function UtilizationBar({ pct }) {
  const clamped = Math.max(0, Math.min(100, pct ?? 0))
  return (
    <div className="util" title={`${pct}% utilized`}>
      <div className="util-track">
        <i style={{ width: `${clamped}%` }} />
      </div>
      <span>{pct}%</span>
    </div>
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
