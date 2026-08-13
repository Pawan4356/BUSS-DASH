import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog, DetailHeader, TableSkeleton, useToast } from '../../shared/components'
import { useGetCandidateQuery, useHireCandidateMutation, useUpdateCandidateMutation } from './api'

const EDITABLE_FIELDS = ['name', 'email', 'phone', 'qualifications', 'experience', 'coverNote', 'portfolio']

function buildForm(candidate) {
  return Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, candidate[f] ?? '']))
}

export function CandidateDetail() {
  const { recruitmentId, candidateId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { push } = useToast()

  const { data: candidate, isLoading } = useGetCandidateQuery(candidateId)
  const [updateCandidate, { isLoading: saving }] = useUpdateCandidateMutation()
  const [hireCandidate, { isLoading: hiring }] = useHireCandidateMutation()
  const [mode, setMode] = useState(location.state?.startInEdit ? 'edit' : 'view')
  const [form, setForm] = useState(null)
  const [confirmingHire, setConfirmingHire] = useState(false)

  useEffect(() => {
    if (candidate) setForm(buildForm(candidate))
  }, [candidate])

  if (isLoading || !form) return <TableSkeleton rows={4} cols={2} />

  const editable = candidate.source === 'WALK_IN'

  async function handleSave() {
    try {
      await updateCandidate({ id: candidateId, ...form }).unwrap()
      push('Changes saved')
      setMode('view')
    } catch {
      push('Could not save changes', { tone: 'danger' })
    }
  }

  async function handleHire() {
    try {
      await hireCandidate(candidateId).unwrap()
      push(`${candidate.name} hired — added to Staff Directory`)
      navigate(`/staff-recruitment/candidates/${recruitmentId}`)
    } catch (err) {
      push(err.data?.message ?? 'Could not hire candidate', { tone: 'danger' })
    } finally {
      setConfirmingHire(false)
    }
  }

  return (
    <div>
      <DetailHeader
        backTo={`/staff-recruitment/candidates/${recruitmentId}`}
        backLabel="Candidates"
        title={candidate.name}
        subtitle={candidate.accountId ? `Account ID: ${candidate.accountId}` : 'Walk-in applicant'}
        mode={mode}
        onEdit={editable ? () => setMode('edit') : undefined}
        onSave={handleSave}
        onCancel={() => {
          setForm(buildForm(candidate))
          setMode('view')
        }}
        saving={saving}
      />

      {candidate.status !== 'HIRED' && (
        <div className="cluster" style={{ marginBottom: 16 }}>
          <button type="button" className="btn btn-primary" onClick={() => setConfirmingHire(true)}>
            Hire
          </button>
        </div>
      )}

      <div className="field-grid">
        <TextField label="Name" mode={mode} value={form.name} onChange={(v) => set(setForm, 'name', v)} />
        <TextField label="Email" mode={mode} value={form.email} onChange={(v) => set(setForm, 'email', v)} />
        <TextField label="Phone" mode={mode} value={form.phone} onChange={(v) => set(setForm, 'phone', v)} />
        <TextField label="Experience" mode={mode} value={form.experience} onChange={(v) => set(setForm, 'experience', v)} />
        <TextField label="CV / Resume" mode={mode} value={candidate.cvUrl ?? ''} onChange={() => {}} readOnly />
        <TextField label="Portfolio" mode={mode} value={form.portfolio} onChange={(v) => set(setForm, 'portfolio', v)} />
      </div>
      <TextArea label="Qualifications" mode={mode} value={form.qualifications} onChange={(v) => set(setForm, 'qualifications', v)} />
      <TextArea label="Cover Note" mode={mode} value={form.coverNote} onChange={(v) => set(setForm, 'coverNote', v)} />

      <ConfirmDialog
        open={confirmingHire}
        title={`Hire ${candidate.name}?`}
        description="This creates a Staff Directory record from this candidate's details."
        confirmLabel={hiring ? 'Hiring…' : 'Hire'}
        onConfirm={handleHire}
        onCancel={() => setConfirmingHire(false)}
      />
    </div>
  )
}

function set(setForm, key, value) {
  setForm((f) => ({ ...f, [key]: value }))
}

function TextField({ label, mode, value, onChange, readOnly }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {mode === 'edit' && !readOnly ? (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
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
