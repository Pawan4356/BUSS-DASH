import { useState } from 'react'
import { Tabs } from '../../shared/components'
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
        <Tabs
          ariaLabel="Scheduling view"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'summary', label: 'Summary' },
            { value: 'list', label: 'List' },
          ]}
        />
      </div>

      {tab === 'summary' ? <SchedulingSummary /> : <SchedulingList />}
    </div>
  )
}
