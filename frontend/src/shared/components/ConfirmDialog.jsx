/**
 * Blocking confirmation for destructive actions (row-menu Delete, Close
 * Recruitment, etc). Intentionally plain — a native <dialog>-style modal,
 * no animation budget spent here.
 */
export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="modal-scrim" onClick={onCancel}>
      <div className="card modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-dialog-title" className="modal-title">
          {title}
        </h2>
        {description && <p className="modal-lead">{description}</p>}
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
