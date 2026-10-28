import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { DetailHeader, NotFound, StatusBadge, TableSkeleton, useToast } from '../../shared/components'
import { BUSINESS_STATUS, OPERATIONAL_STATUS, toOptions } from '../../shared/ui-tags'
import { FLAGS } from '../../shared/flags'
import { useCanManage } from '../../shared/permissions'
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
  const { data: workspace, isLoading, error: loadError } = useGetWorkspaceQuery(id)
  const [updateWorkspace, { isLoading: saving }] = useUpdateWorkspaceMutation()
  const canManage = useCanManage(FLAGS.RESOURCE_DIRECTORY)
  const [mode, setMode] = useState(canManage && location.state?.startInEdit ? 'edit' : 'view')
  const [form, setForm] = useState(null)
  const { push } = useToast()

  useEffect(() => {
    if (workspace) setForm(buildForm(workspace))
  }, [workspace])

  if (loadError?.status === 404) {
    return (
      <NotFound
        title="Workspace not found"
        description="This workspace may have been deleted, or the link is incorrect."
        backTo="/resource-directory"
        backLabel="Back to Resource Directory"
      />
    )
  }
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
        subtitle={workspace.type || undefined}
        mode={mode}
        onEdit={canManage ? () => setMode('edit') : undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />

      <section className="detail-card">
        <div className="detail-card-head">
          <h2 className="section-title">Overview</h2>
        </div>
        <div className="field-grid">
          {mode === 'edit' && (
            <div className="field">
              <span className="field-label">Name</span>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
          )}
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
              <div className="field-static">
                <StatusBadge value={form.businessStatus} label={BUSINESS_STATUS[form.businessStatus]} />
              </div>
            )}
          </div>
          {flags?.operationalScheduling && (
            <div className="field">
              <span className="field-label">Operational Status</span>
              <div className="field-static">
                {workspace.operationalStatus ? (
                  <StatusBadge value={workspace.operationalStatus} label={OPERATIONAL_STATUS[workspace.operationalStatus]} />
                ) : (
                  <span className="detail-empty">Not scheduled yet</span>
                )}
              </div>
            </div>
          )}
        </div>
        {flags?.staffDirectory && (
          <>
            <h3 className="detail-sub" style={{ marginTop: 16 }}>
              Responsible
            </h3>
            {workspace.responsiblePersons?.length > 0 ? (
              <div className="chips">
                {workspace.responsiblePersons.map((p) => (
                  <span className="chip" key={p.id ?? p.name}>
                    {p.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="detail-empty">Unassigned</p>
            )}
          </>
        )}
      </section>

      <section className="detail-card">
        <div className="detail-card-head">
          <h2 className="section-title">Sub-spaces</h2>
          <span className="count">{form.subSpaces.length}</span>
        </div>
        {mode === 'edit' ? (
          <div className="check-grid">
            {form.subSpaces.map((s, index) => (
              <div className="cluster" key={index}>
                <input className="input" value={s.name} onChange={(e) => updateSubSpace(index, e.target.value)} />
                <button type="button" className="btn btn-icon" aria-label="Remove sub-space" onClick={() => removeSubSpace(index)}>
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-sm schedule-add" onClick={addSubSpace}>
              + Add sub-space
            </button>
          </div>
        ) : form.subSpaces.length === 0 ? (
          <p className="detail-empty">No sub-spaces</p>
        ) : (
          <div className="chips">
            {form.subSpaces.map((s, index) => (
              <span className="chip" key={index}>
                {s.name}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
