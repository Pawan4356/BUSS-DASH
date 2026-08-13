import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { DetailHeader, TableSkeleton, useToast } from '../../shared/components'
import { INTERVIEW_STATUS, INTERVIEW_TYPE, RECRUITMENT_AUDIENCE, toOptions } from '../../shared/ui-tags'
import { useGetRecruitmentQuery, useLaunchRecruitmentMutation, useUpdateRecruitmentMutation } from './api'
import { useListStaffQuery } from '../staff-directory/api'

function buildForm(recruitment) {
  return {
    role: recruitment.role,
    experienceRequired: recruitment.experienceRequired ?? '',
    employmentType: recruitment.employmentType ?? '',
    numberOfOpenings: recruitment.numberOfOpenings ?? '',
    description: recruitment.description ?? '',
    requirements: recruitment.requirements ?? '',
    benefits: recruitment.benefits ?? '',
    audience: recruitment.audience ?? '',
    interviewRequired: recruitment.interviewRequired,
    interviewRounds: recruitment.interviewRounds.map((round) => ({ ...round })),
  }
}

export function RecruitmentDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { push } = useToast()
  const business = useSelector((s) => s.auth.business)
  const flags = useSelector((s) => s.auth.flags)

  const { data: recruitment, isLoading } = useGetRecruitmentQuery(id)
  const { data: staffList } = useListStaffQuery({ archived: false }, { skip: !flags?.staffDirectory })
  const [updateRecruitment, { isLoading: saving }] = useUpdateRecruitmentMutation()
  const [launchRecruitment] = useLaunchRecruitmentMutation()
  const [mode, setMode] = useState(location.state?.startInEdit ? 'edit' : 'view')
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (recruitment) setForm(buildForm(recruitment))
  }, [recruitment])

  if (isLoading || !form) return <TableSkeleton rows={6} cols={2} />

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addRound() {
    set('interviewRounds', [
      ...form.interviewRounds,
      { type: 'LOCATION', locationAddress: '', date: '', time: '', description: '', status: 'SCHEDULED' },
    ])
  }
  function updateRound(index, patch) {
    set('interviewRounds', form.interviewRounds.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  function removeRound(index) {
    set('interviewRounds', form.interviewRounds.filter((_, i) => i !== index))
  }

  async function handleSave() {
    try {
      await updateRecruitment({
        id,
        ...form,
        numberOfOpenings: form.numberOfOpenings === '' ? null : Number(form.numberOfOpenings),
      }).unwrap()
      push('Changes saved')
      setMode('view')
    } catch {
      push('Could not save changes', { tone: 'danger' })
    }
  }

  function handleCancel() {
    setForm(buildForm(recruitment))
    setMode('view')
  }

  async function handleLaunch() {
    try {
      await launchRecruitment(id).unwrap()
      push('Recruitment launched')
    } catch (err) {
      push(err.data?.message ?? 'Could not launch', { tone: 'danger' })
    }
  }

  return (
    <div>
      <DetailHeader
        backTo="/staff-recruitment"
        backLabel="Staff Recruitment"
        title={recruitment.role}
        subtitle={`Status: ${recruitment.status}`}
        mode={mode}
        onEdit={() => setMode('edit')}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />

      <div className="cluster" style={{ marginBottom: 16 }}>
        {recruitment.status === 'INACTIVE' && (
          <button type="button" className="btn btn-primary" onClick={handleLaunch}>
            Launch
          </button>
        )}
        <button type="button" className="btn" onClick={() => navigate(`/staff-recruitment/candidates/${id}`)}>
          View Candidates
        </button>
      </div>

      <div className="field-grid">
        <TextField label="Role" mode={mode} value={form.role} onChange={(v) => set('role', v)} />
        <TextField label="Experience Required" mode={mode} value={form.experienceRequired} onChange={(v) => set('experienceRequired', v)} />
        <TextField label="Employment Type" mode={mode} value={form.employmentType} onChange={(v) => set('employmentType', v)} />
        <TextField label="Number of Openings" mode={mode} type="number" value={form.numberOfOpenings} onChange={(v) => set('numberOfOpenings', v)} />
        <div className="field">
          <span className="field-label">Recruitment Audience</span>
          {business.recruitmentModelType === 'BOTH' && mode === 'edit' ? (
            <select className="select" value={form.audience ?? ''} onChange={(e) => set('audience', e.target.value)}>
              {toOptions(RECRUITMENT_AUDIENCE).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="field-static">{RECRUITMENT_AUDIENCE[form.audience] ?? RECRUITMENT_AUDIENCE[business.recruitmentModelType] ?? '—'}</div>
          )}
        </div>
      </div>
      <TextArea label="Description" mode={mode} value={form.description} onChange={(v) => set('description', v)} />
      <TextArea label="Requirements" mode={mode} value={form.requirements} onChange={(v) => set('requirements', v)} />
      <TextArea label="Benefits" mode={mode} value={form.benefits} onChange={(v) => set('benefits', v)} />

      <h2 className="section-title">Interview Settings</h2>
      <label className="cluster" style={{ fontSize: 13, marginBottom: 12 }}>
        <input
          type="checkbox"
          disabled={mode !== 'edit'}
          checked={form.interviewRequired}
          onChange={(e) => set('interviewRequired', e.target.checked)}
        />
        Interview Required
      </label>

      {form.interviewRequired && (
        <div className="stack">
          {form.interviewRounds.map((round, index) => (
            <div className="card" style={{ padding: 16 }} key={index}>
              <div className="cluster" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>Round {index + 1}</strong>
                {mode === 'edit' && (
                  <button type="button" className="btn btn-icon" aria-label="Remove round" onClick={() => removeRound(index)}>
                    ✕
                  </button>
                )}
              </div>
              <div className="field-grid">
                <div className="field">
                  <span className="field-label">Type</span>
                  {mode === 'edit' ? (
                    <select className="select" value={round.type} onChange={(e) => updateRound(index, { type: e.target.value })}>
                      {toOptions(INTERVIEW_TYPE).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="field-static">{INTERVIEW_TYPE[round.type]}</div>
                  )}
                </div>
                {round.type === 'LOCATION' ? (
                  <TextField
                    label="Address"
                    mode={mode}
                    value={round.locationAddress ?? ''}
                    onChange={(v) => updateRound(index, { locationAddress: v })}
                  />
                ) : (
                  <TextField label="Link" mode={mode} value={round.onlineLink ?? ''} onChange={(v) => updateRound(index, { onlineLink: v })} />
                )}
                <TextField
                  label="Date"
                  mode={mode}
                  type="date"
                  value={round.date?.slice(0, 10) ?? ''}
                  onChange={(v) => updateRound(index, { date: v })}
                />
                <TextField label="Time" mode={mode} type="time" value={round.time ?? ''} onChange={(v) => updateRound(index, { time: v })} />
                {flags?.staffDirectory ? (
                  <div className="field">
                    <span className="field-label">Interviewer (Staff)</span>
                    {mode === 'edit' ? (
                      <select
                        className="select"
                        value={round.interviewerStaffId ?? ''}
                        onChange={(e) => updateRound(index, { interviewerStaffId: e.target.value || null })}
                      >
                        <option value="">— None —</option>
                        {(staffList ?? []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name ?? s.id}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="field-static">
                        {staffList?.find((s) => s.id === round.interviewerStaffId)?.name ?? '—'}
                      </div>
                    )}
                  </div>
                ) : (
                  <TextField
                    label="Interviewer (manual)"
                    mode={mode}
                    value={round.interviewerManualName ?? ''}
                    onChange={(v) => updateRound(index, { interviewerManualName: v })}
                  />
                )}
                <div className="field">
                  <span className="field-label">Interview Status</span>
                  {mode === 'edit' ? (
                    <select className="select" value={round.status} onChange={(e) => updateRound(index, { status: e.target.value })}>
                      {toOptions(INTERVIEW_STATUS).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="field-static">{INTERVIEW_STATUS[round.status]}</div>
                  )}
                </div>
              </div>
              <TextArea label="Description" mode={mode} value={round.description ?? ''} onChange={(v) => updateRound(index, { description: v })} />
            </div>
          ))}
          {mode === 'edit' && (
            <button type="button" className="btn btn-sm" onClick={addRound}>
              + Add Round
            </button>
          )}
        </div>
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
