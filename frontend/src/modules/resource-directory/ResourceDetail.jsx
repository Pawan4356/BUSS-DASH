import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { DetailHeader, TableSkeleton, useToast } from '../../shared/components'
import { BUSINESS_STATUS, OPERATIONAL_STATUS, RESOURCE_BEHAVIOR, toOptions } from '../../shared/ui-tags'
import { useGetResourceQuery, useListWorkspacesQuery, useUpdateResourceMutation } from './api'

function buildForm(resource) {
  return {
    category: resource.category ?? '',
    businessStatus: resource.businessStatus,
    behavior: resource.behavior,
    schedulingRequired: resource.schedulingRequired,
    workspaceIds: resource.workspaceIds,
  }
}

export function ResourceDetail() {
  const { id } = useParams()
  const location = useLocation()
  const flags = useSelector((s) => s.auth.flags)
  const { data: resource, isLoading } = useGetResourceQuery(id)
  const { data: workspaces } = useListWorkspacesQuery()
  const [updateResource, { isLoading: saving }] = useUpdateResourceMutation()
  const [mode, setMode] = useState(location.state?.startInEdit ? 'edit' : 'view')
  const [form, setForm] = useState(null)
  const { push } = useToast()

  useEffect(() => {
    if (resource) setForm(buildForm(resource))
  }, [resource])

  if (isLoading || !form) return <TableSkeleton rows={4} cols={2} />

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    try {
      await updateResource({ id, ...form }).unwrap()
      push('Changes saved')
      setMode('view')
    } catch {
      push('Could not save changes', { tone: 'danger' })
    }
  }

  function handleCancel() {
    setForm(buildForm(resource))
    setMode('view')
  }

  return (
    <div>
      <DetailHeader
        backTo="/resource-directory"
        backLabel="Resource Directory"
        title={resource.name}
        mode={mode}
        onEdit={() => setMode('edit')}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />

      <div className="field-grid">
        <div className="field">
          <span className="field-label">Location</span>
          {mode === 'edit' ? (
            <div className="stack">
              {(workspaces ?? []).map((w) => (
                <label key={w.id} className="cluster" style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.workspaceIds.includes(w.id)}
                    onChange={(e) =>
                      set(
                        'workspaceIds',
                        e.target.checked ? [...form.workspaceIds, w.id] : form.workspaceIds.filter((wid) => wid !== w.id),
                      )
                    }
                  />
                  {w.name}
                </label>
              ))}
              {(workspaces ?? []).length === 0 && <span className="text-muted">No workspaces to attach — leave as Independent</span>}
            </div>
          ) : (
            <div className="field-static">{resource.location.length > 0 ? resource.location.join(', ') : 'Independent Resource'}</div>
          )}
        </div>
        <div className="field">
          <span className="field-label">Category</span>
          {mode === 'edit' ? (
            <input className="input" value={form.category} onChange={(e) => set('category', e.target.value)} />
          ) : (
            <div className="field-static">{form.category || '—'}</div>
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
              {resource.operationalStatus ? OPERATIONAL_STATUS[resource.operationalStatus] : 'Not scheduled yet'}
            </div>
          </div>
        )}
        {flags?.staffDirectory && (
          <div className="field">
            <span className="field-label">Responsible Person</span>
            <div className="field-static">{resource.responsible?.length > 0 ? resource.responsible.join(', ') : 'Unassigned'}</div>
          </div>
        )}
        <div className="field">
          <span className="field-label">Behavior</span>
          {mode === 'edit' ? (
            <select className="select" value={form.behavior} onChange={(e) => set('behavior', e.target.value)}>
              {toOptions(RESOURCE_BEHAVIOR).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="field-static">{RESOURCE_BEHAVIOR[form.behavior]}</div>
          )}
        </div>
        <div className="field">
          <span className="field-label">Scheduling Required</span>
          {mode === 'edit' ? (
            <label className="cluster" style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.schedulingRequired}
                onChange={(e) => set('schedulingRequired', e.target.checked)}
              />
              Yes
            </label>
          ) : (
            <div className="field-static">{form.schedulingRequired ? 'Yes' : 'No'}</div>
          )}
        </div>
      </div>
    </div>
  )
}
