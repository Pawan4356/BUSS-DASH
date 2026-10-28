import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Avatar,
  DatePicker,
  DetailHeader,
  NotFound,
  StatusBadge,
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
import { FLAGS } from '../../shared/flags'
import { useCanManage } from '../../shared/permissions'
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
  const canManage = useCanManage(FLAGS.STAFF_DIRECTORY)

  const { data: staff, isLoading, error: loadError } = useGetStaffQuery(id)
  const [updateStaff, { isLoading: saving }] = useUpdateStaffMutation()
  const [mode, setMode] = useState(canManage && location.state?.startInEdit ? 'edit' : 'view')
  const [form, setForm] = useState(null)

  const { data: workspaces } = useListWorkspacesQuery(undefined, { skip: !flags?.resourceDirectory })
  const { data: resources } = useListResourcesQuery(undefined, { skip: !flags?.resourceDirectory })

  useEffect(() => {
    if (staff) setForm(buildForm(staff))
  }, [staff])

  if (loadError?.status === 404) {
    return (
      <NotFound
        title="Staff member not found"
        description="This person may have been removed from the directory, or the link is incorrect."
        backTo="/staff-directory"
        backLabel="Back to Staff Directory"
      />
    )
  }
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
        leading={<Avatar name={name} size={52} />}
        subtitle={
          <span className="detail-meta">
            <span>{staff.accountId ?? 'Pending invitation'}</span>
            {staff.title && (
              <>
                <span className="dot" />
                <span>{staff.title}</span>
              </>
            )}
            <StatusBadge value={staff.status} label={STAFF_STATUS[staff.status]} />
          </span>
        }
        mode={mode}
        onEdit={canManage ? () => setMode('edit') : undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />

      <div className="detail-columns">
        <section className="detail-card">
          <CardHead title="General" />
          <div className="field-grid">
            <TextField label="First Name" mode={mode} value={form.firstName} onChange={(v) => set('firstName', v)} />
            <TextField label="Last Name" mode={mode} value={form.lastName} onChange={(v) => set('lastName', v)} />
            <TextField label="Phone Number" mode={mode} value={form.phoneNumber} onChange={(v) => set('phoneNumber', v)} />
            <TextField label="Gender" mode={mode} value={form.gender} onChange={(v) => set('gender', v)} />
            <TextField label="Date of Birth" mode={mode} type="date" value={form.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} />
          </div>
        </section>

        <section className="detail-card">
          <CardHead title="Professional" />
          <div className="field-grid">
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
                <div className="field-static">
                  <StatusBadge value={form.status} label={STAFF_STATUS[form.status]} />
                </div>
              )}
            </div>
            <div className="field">
              <span className="field-label">Responsibilities</span>
              <div className="field-static">{staff.responsibilitiesCount}</div>
            </div>
          </div>
        </section>
      </div>

      <section className="detail-card">
        <CardHead title="Background" />
        <div className="field-grid is-wide">
          <TextArea label="Qualifications" mode={mode} value={form.qualifications} onChange={(v) => set('qualifications', v)} />
          <TextArea label="Past Experience" mode={mode} value={form.pastExperience} onChange={(v) => set('pastExperience', v)} />
        </div>
      </section>

      <section className="detail-card">
        <CardHead title="Working Schedule" />
        {mode === 'edit' ? (
          <TimeWindowPicker value={form.workingSchedule} onChange={(v) => set('workingSchedule', v)} />
        ) : (
          <WeekView schedule={form.workingSchedule} />
        )}
      </section>

      {(flags?.resourceDirectory || availableResponsibilities.length > 0) && (
        <section className="detail-card">
          <CardHead title="Responsibilities" />
          <div className={`detail-groups${mode === 'edit' ? ' is-editing' : ''}`}>
            {availableResponsibilities.length > 0 && (
              <div>
                <h3 className="detail-sub">Work</h3>
                <ChecklistField
                  mode={mode}
                  options={availableResponsibilities.map((key) => ({ id: key, name: WORK_RESPONSIBILITY_LABELS[key] }))}
                  selected={availableResponsibilities.filter((key) => form.workResponsibility[key])}
                  onChange={(keys) =>
                    set('workResponsibility', {
                      ...form.workResponsibility,
                      ...Object.fromEntries(availableResponsibilities.map((k) => [k, keys.includes(k)])),
                    })
                  }
                  emptyLabel="None"
                />
              </div>
            )}
            {flags?.resourceDirectory && (
              <>
                <div>
                  <h3 className="detail-sub">Workspaces</h3>
                  <ChecklistField
                    mode={mode}
                    options={workspaces ?? []}
                    selected={form.workspaceIds}
                    onChange={(v) => set('workspaceIds', v)}
                    emptyLabel="No workspaces yet"
                  />
                </div>
                <div>
                  <h3 className="detail-sub">Resources</h3>
                  <ChecklistField
                    mode={mode}
                    options={resources ?? []}
                    selected={form.resourceIds}
                    onChange={(v) => set('resourceIds', v)}
                    emptyLabel="No resources yet"
                  />
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function CardHead({ title }) {
  return (
    <div className="detail-card-head">
      <h2 className="section-title">{title}</h2>
    </div>
  )
}

function TextField({ label, mode, value, onChange, type = 'text' }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {mode === 'edit' ? (
        type === 'date' ? (
          <DatePicker value={value} onChange={onChange} clearable ariaLabel={label} />
        ) : (
          <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
        )
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
        <div className="field-static is-prose">{value || '—'}</div>
      )}
    </div>
  )
}

function WeekView({ schedule }) {
  return (
    <div className="week-view">
      {Object.entries(schedule).map(([day, value]) => {
        const working = !value.isOff && value.windows.length > 0
        return (
          <div key={day} className={`week-day${working ? ' is-working' : ''}`}>
            <b>{DAY_OF_WEEK_SHORT[day]}</b>
            {working ? (
              value.windows.map((w, i) => <span key={i}>{`${w.start}–${w.end}`}</span>)
            ) : (
              <span>{value.isOff ? 'Off' : '—'}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ChecklistField({ mode, options, selected, onChange, emptyLabel }) {
  if (options.length === 0) return <p className="detail-empty">{emptyLabel}</p>
  if (mode !== 'edit') {
    const picked = options.filter((o) => selected.includes(o.id))
    if (picked.length === 0) return <p className="detail-empty">None assigned</p>
    return (
      <div className="chips">
        {picked.map((o) => (
          <span className="chip" key={o.id}>
            {o.name}
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className="check-grid">
      {options.map((o) => (
        <label key={o.id} className="check-tile">
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
