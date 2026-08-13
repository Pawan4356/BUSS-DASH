import { Link } from 'react-router-dom'

/**
 * Detail page header (spec §4): back button, title, and the view/edit mode
 * switch — Edit in view mode; Save/Cancel in edit mode.
 */
export function DetailHeader({
  backTo,
  backLabel = 'Back',
  title,
  subtitle,
  mode,
  onEdit,
  onSave,
  onCancel,
  saving = false,
}) {
  return (
    <div>
      <Link to={backTo} className="back-link">
        ← {backLabel}
      </Link>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <div className="cluster">
          {mode === 'view' && onEdit && (
            <button type="button" className="btn btn-primary" onClick={onEdit}>
              Edit
            </button>
          )}
          {mode === 'edit' && (
            <>
              <button type="button" className="btn" onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
