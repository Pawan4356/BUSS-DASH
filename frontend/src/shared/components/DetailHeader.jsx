import { Link } from 'react-router-dom'
import { BackIcon } from './BackIcon'

/**
 * Detail page header (spec §4): back button, title, and the view/edit mode
 * switch — Edit in view mode; Save/Cancel in edit mode. `leading` (e.g. an
 * avatar) sits left of the title; `subtitle` may be text or a node.
 */
export function DetailHeader({
  backTo,
  backLabel = 'Back',
  title,
  subtitle,
  leading,
  mode,
  onEdit,
  onSave,
  onCancel,
  saving = false,
}) {
  return (
    <div>
      <Link to={backTo} className="back-link">
        <span className="back-link-icon">
          <BackIcon />
        </span>
        {backLabel}
      </Link>
      <div className="page-header">
        <div className="detail-title">
          {leading}
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <div className="page-subtitle">{subtitle}</div>}
          </div>
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
