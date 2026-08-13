import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { DetailHeader, TableSkeleton, useToast } from '../../shared/components'
import { BUSINESS_STATUS, OPERATIONAL_STATUS, toOptions } from '../../shared/ui-tags'
import { useGetWorkspaceQuery, useUpdateWorkspaceMutation } from './api'

function buildForm(workspace) {
  return {
    name: workspace.name,
    type: workspace.type ?? '',
    businessStatus: workspace.businessStatus,
    subSpaces: workspace.subSpaces.map((s) => ({ ...s })),
  }
}

export function WorkspaceDetail() {
  const { id } = useParams()
  const location = useLocation()
  const flags = useSelector((s) => s.auth.flags)
  const { data: workspace, isLoading } = useGetWorkspaceQuery(id)
  const [updateWorkspace, { isLoading: saving }] = useUpdateWorkspaceMutation()
  const [mode, setMode] = useState(location.state?.startInEdit ? 'edit' : 'view')
  const [form, setForm] = useState(null)
  const { push } = useToast()

  useEffect(() => {
    if (workspace) setForm(buildForm(workspace))
  }, [workspace])

  if (isLoading || !form) return <TableSkeleton rows={4} cols={2} />

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addSubSpace() {
    set('subSpaces', [...form.subSpaces, { name: '' }])
  }
  function updateSubSpace(index, name) {
    set('subSpaces', form.subSpaces.map((s, i) => (i === index ? { ...s, name } : s)))
  }
  function removeSubSpace(index) {
    set('subSpaces', form.subSpaces.filter((_, i) => i !== index))
  }

  async function handleSave() {
    try {
      await updateWorkspace({ id, ...form }).unwrap()
      push('Changes saved')
      setMode('view')
    } catch {
      push('Could not save changes', { tone: 'danger' })
    }
  }

  function handleCancel() {
    setForm(buildForm(workspace))
    setMode('view')
  }

  return (
    <div>
      <DetailHeader
        backTo="/resource-directory"
        backLabel="Resource Directory"
        title={workspace.name}
        mode={mode}
        onEdit={() => setMode('edit')}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />

      <div className="field-grid">
        <div className="field">
          <span className="field-label">Name</span>
          {mode === 'edit' ? (
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          ) : (
            <div className="field-static">{form.name}</div>
          )}
        </div>
        <div className="field">
          <span className="field-label">Type</span>
          {mode === 'edit' ? (
            <input className="input" value={form.type} onChange={(e) => set('type', e.target.value)} />
          ) : (
            <div className="field-static">{form.type || '—'}</div>
          )}
        </div>
        <div className="field">
          <span className="field-label">Business Status</span>
          {mode === 'edit' ? (
            <select className="select" value={form.businessStatus} onChange={(e) => set('businessStatus', e.target.value)}>
              {toOptions(BUSINESS_STATUS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="field-static">{BUSINESS_STATUS[form.businessStatus]}</div>
          )}
        </div>
        {flags?.operationalScheduling && (
          <div className="field">
            <span className="field-label">Operational Status</span>
            <div className="field-static">
              {workspace.operationalStatus ? OPERATIONAL_STATUS[workspace.operationalStatus] : 'Not scheduled yet'}
            </div>
          </div>
        )}
        {flags?.staffDirectory && (
          <div className="field">
            <span className="field-label">Responsible Person</span>
            <div className="field-static">
              {workspace.responsiblePersons?.length > 0
                ? workspace.responsiblePersons.map((p) => p.name).join(', ')
                : 'Unassigned'}
            </div>
          </div>
        )}
      </div>

      <h2 className="section-title">Sub-spaces</h2>
      <div className="stack">
        {form.subSpaces.map((s, index) =>
          mode === 'edit' ? (
            <div className="cluster" key={index}>
              <input className="input" value={s.name} onChange={(e) => updateSubSpace(index, e.target.value)} />
              <button type="button" className="btn btn-icon" aria-label="Remove sub-space" onClick={() => removeSubSpace(index)}>
                ✕
              </button>
            </div>
          ) : (
            <div key={index}>{s.name}</div>
          ),
        )}
        {form.subSpaces.length === 0 && mode !== 'edit' && <p className="text-muted">No sub-spaces</p>}
        {mode === 'edit' && (
          <button type="button" className="btn btn-sm" onClick={addSubSpace}>
            + Add Sub-space
          </button>
        )}
      </div>
    </div>
  )
}
