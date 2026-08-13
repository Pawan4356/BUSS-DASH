/**
 * Blocking confirmation for destructive actions (row-menu Delete, Close
 * Recruitment, etc). Intentionally plain — a native <dialog>-style modal,
 * no animation budget spent here.
 */
export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div className="card" style={{ padding: 24, maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-dialog-title" style={{ margin: '0 0 8px', fontSize: 16 }}>
          {title}
        </h2>
        {description && <p className="text-muted" style={{ marginTop: 0 }}>{description}</p>}
        <div className="cluster" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
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
