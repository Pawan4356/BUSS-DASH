import { useState } from 'react'
import { SchedulingSummary } from './SchedulingSummary'
import { SchedulingList } from './SchedulingList'

export function OperationalSchedulingHome() {
  const [tab, setTab] = useState('summary')

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Operational Scheduling</h1>
      </div>

      <div className="toolbar">
        <button type="button" className={`btn ${tab === 'summary' ? 'btn-primary' : ''}`} onClick={() => setTab('summary')}>
          Summary
        </button>
        <button type="button" className={`btn ${tab === 'list' ? 'btn-primary' : ''}`} onClick={() => setTab('list')}>
          List
        </button>
      </div>

      {tab === 'summary' ? <SchedulingSummary /> : <SchedulingList />}
    </div>
  )
}
