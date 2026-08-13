import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  DetailHeader,
  TableSkeleton,
  TimeWindowPicker,
  useToast,
} from '../../shared/components'
import {
  DAY_OF_WEEK_SHORT,
  EMPLOYMENT_TYPE_PRESETS,
  STAFF_STATUS,
  toOptions,
} from '../../shared/ui-tags'
import { useGetStaffQuery, useUpdateStaffMutation } from './api'
import { scheduleFromApi, scheduleToApi } from './scheduleAdapters'
import { useListResourcesQuery, useListWorkspacesQuery } from '../resource-directory/api'

const WORK_RESPONSIBILITY_LABELS = {
  staffRecruitment: 'Staff Recruitment',
  staffAttendance: 'Staff Attendance',
  operationalScheduling: 'Operational Scheduling',
}

function buildForm(staff) {
  return {
    firstName: staff.firstName ?? '',
    lastName: staff.lastName ?? '',
    phoneNumber: staff.phoneNumber ?? '',
    gender: staff.gender ?? '',
    dateOfBirth: staff.dateOfBirth?.slice(0, 10) ?? '',
    title: staff.title ?? '',
    dateOfJoining: staff.dateOfJoining?.slice(0, 10) ?? '',
    yearsOfExperience: staff.yearsOfExperience ?? '',
    qualifications: staff.qualifications ?? '',
    pastExperience: staff.pastExperience ?? '',
    employmentType: staff.employmentType ?? '',
    status: staff.status,
    workingSchedule: scheduleFromApi(staff.workingSchedule),
    workResponsibility: staff.workResponsibility,
    workspaceIds: staff.workspaceResponsibilities.map((w) => w.id),
    resourceIds: staff.resourceResponsibilities.map((r) => r.id),
  }
}

export function StaffDirectoryDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { push } = useToast()
  const flags = useSelector((s) => s.auth.flags)

  const { data: staff, isLoading } = useGetStaffQuery(id)
  const [updateStaff, { isLoading: saving }] = useUpdateStaffMutation()
  const [mode, setMode] = useState(location.state?.startInEdit ? 'edit' : 'view')
  const [form, setForm] = useState(null)

  const { data: workspaces } = useListWorkspacesQuery(undefined, { skip: !flags?.resourceDirectory })
  const { data: resources } = useListResourcesQuery(undefined, { skip: !flags?.resourceDirectory })

  useEffect(() => {
    if (staff) setForm(buildForm(staff))
  }, [staff])

  if (isLoading || !form) return <TableSkeleton rows={6} cols={2} />

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    try {
      await updateStaff({
        id,
        ...form,
        yearsOfExperience: form.yearsOfExperience === '' ? null : Number(form.yearsOfExperience),
        workingSchedule: scheduleToApi(form.workingSchedule),
      }).unwrap()
      push('Changes saved')
      setMode('view')
    } catch {
      push('Could not save changes', { tone: 'danger' })
    }
  }

  function handleCancel() {
    setForm(buildForm(staff))
    setMode('view')
  }

  const name = [staff.firstName, staff.lastName].filter(Boolean).join(' ') || 'Staff member'
  const availableResponsibilities = Object.keys(WORK_RESPONSIBILITY_LABELS).filter((key) => flags?.[key])

  return (
    <div>
      <DetailHeader
        backTo="/staff-directory"
        backLabel="Staff Directory"
        title={name}
        subtitle={staff.accountId ? `Account ID: ${staff.accountId}` : 'Pending invitation'}
        mode={mode}
        onEdit={() => setMode('edit')}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />

      <h2 className="section-title">General</h2>
      <div className="field-grid">
        <TextField label="First Name" mode={mode} value={form.firstName} onChange={(v) => set('firstName', v)} />
        <TextField label="Last Name" mode={mode} value={form.lastName} onChange={(v) => set('lastName', v)} />
        <TextField label="Phone Number" mode={mode} value={form.phoneNumber} onChange={(v) => set('phoneNumber', v)} />
        <TextField label="Gender" mode={mode} value={form.gender} onChange={(v) => set('gender', v)} />
        <TextField label="Date of Birth" mode={mode} type="date" value={form.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} />
      </div>

      <h2 className="section-title">Professional</h2>
      <div className="field-grid">
        <div className="field">
          <span className="field-label">Account ID</span>
          <div className="field-static">{staff.accountId ?? '—'}</div>
        </div>
        <TextField label="Title" mode={mode} value={form.title} onChange={(v) => set('title', v)} />
        <TextField label="Date of Joining" mode={mode} type="date" value={form.dateOfJoining} onChange={(v) => set('dateOfJoining', v)} />
        <TextField
          label="Years of Experience"
          mode={mode}
          type="number"
          value={form.yearsOfExperience}
          onChange={(v) => set('yearsOfExperience', v)}
        />
        <div className="field">
          <span className="field-label">Employment Type</span>
          {mode === 'edit' ? (
            <>
              <input
                className="input"
                list="employment-type-presets"
                value={form.employmentType}
                onChange={(e) => set('employmentType', e.target.value)}
              />
              <datalist id="employment-type-presets">
                {EMPLOYMENT_TYPE_PRESETS.map((preset) => (
                  <option key={preset} value={preset} />
                ))}
              </datalist>
            </>
          ) : (
            <div className="field-static">{form.employmentType || '—'}</div>
          )}
        </div>
        <div className="field">
          <span className="field-label">Status</span>
          {mode === 'edit' ? (
            <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {toOptions(STAFF_STATUS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="field-static">{STAFF_STATUS[form.status]}</div>
          )}
        </div>
        <div className="field">
          <span className="field-label">Responsibilities</span>
          <div className="field-static">{staff.responsibilitiesCount}</div>
        </div>
      </div>
      <TextArea label="Qualifications" mode={mode} value={form.qualifications} onChange={(v) => set('qualifications', v)} />
      <TextArea label="Past Experience" mode={mode} value={form.pastExperience} onChange={(v) => set('pastExperience', v)} />

      <h2 className="section-title">Working Schedule</h2>
      {mode === 'edit' ? (
        <TimeWindowPicker value={form.workingSchedule} onChange={(v) => set('workingSchedule', v)} />
      ) : (
        <ScheduleSummary schedule={form.workingSchedule} />
      )}

      {flags?.resourceDirectory && (
        <>
          <h2 className="section-title">Workspace Responsibility</h2>
          <ChecklistField
            mode={mode}
            options={workspaces ?? []}
            selected={form.workspaceIds}
            onChange={(v) => set('workspaceIds', v)}
            emptyLabel="No workspaces yet"
          />

          <h2 className="section-title">Resources Responsibility</h2>
          <ChecklistField
            mode={mode}
            options={resources ?? []}
            selected={form.resourceIds}
            onChange={(v) => set('resourceIds', v)}
            emptyLabel="No resources yet"
          />
        </>
      )}

      {availableResponsibilities.length > 0 && (
        <>
          <h2 className="section-title">Work Responsibility</h2>
          <div className="stack">
            {availableResponsibilities.map((key) => (
              <label key={key} className="cluster" style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  disabled={mode !== 'edit'}
                  checked={form.workResponsibility[key]}
                  onChange={(e) =>
                    set('workResponsibility', { ...form.workResponsibility, [key]: e.target.checked })
                  }
                />
                {WORK_RESPONSIBILITY_LABELS[key]}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TextField({ label, mode, value, onChange, type = 'text' }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {mode === 'edit' ? (
        <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="field-static">{value || '—'}</div>
      )}
    </div>
  )
}

function TextArea({ label, mode, value, onChange }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {mode === 'edit' ? (
        <textarea className="textarea" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="field-static">{value || '—'}</div>
      )}
    </div>
  )
}

function ScheduleSummary({ schedule }) {
  return (
    <div className="stack">
      {Object.entries(schedule).map(([day, value]) => (
        <div key={day} className="cluster">
          <strong style={{ width: 90 }}>{DAY_OF_WEEK_SHORT[day]}</strong>
          <span className="text-muted">
            {value.isOff
              ? 'Off'
              : value.windows.length === 0
                ? 'No windows set'
                : value.windows.map((w) => `${w.start}–${w.end}`).join(', ')}
          </span>
        </div>
      ))}
    </div>
  )
}

function ChecklistField({ mode, options, selected, onChange, emptyLabel }) {
  if (options.length === 0) return <p className="text-muted">{emptyLabel}</p>
  if (mode !== 'edit') {
    const names = options.filter((o) => selected.includes(o.id)).map((o) => o.name)
    return <p className="text-muted">{names.length > 0 ? names.join(', ') : 'None assigned'}</p>
  }
  return (
    <div className="stack">
      {options.map((o) => (
        <label key={o.id} className="cluster" style={{ fontSize: 13 }}>
          <input
            type="checkbox"
            checked={selected.includes(o.id)}
            onChange={(e) =>
              onChange(e.target.checked ? [...selected, o.id] : selected.filter((id) => id !== o.id))
            }
          />
          {o.name}
        </label>
      ))}
    </div>
  )
}
