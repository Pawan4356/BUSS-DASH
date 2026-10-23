/** Generic form-in-modal shell for the "+ Add X" / "+ Invite X" flows every module has. */
export function Modal({ title, lead, onClose, children, width = 480 }) {
  return (
    <div role="dialog" aria-modal="true" className="modal-scrim" onClick={onClose}>
      <div className="card modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{title}</h2>
            {lead && <p className="modal-lead">{lead}</p>}
          </div>
          <button type="button" className="btn btn-icon" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
