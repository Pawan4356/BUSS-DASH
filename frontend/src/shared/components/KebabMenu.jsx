import { useRef, useState } from 'react'
import { useOutsideClick } from './useOutsideClick'

/**
 * Row-actions kebab menu (spec §4): View details / Edit / Delete, or any
 * caller-supplied item list. Each item: { label, onClick, danger?, disabled? }.
 */
export function KebabMenu({ items, ariaLabel = 'Row actions' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useOutsideClick(ref, () => setOpen(false), open)

  return (
    <div className="kebab" ref={ref}>
      <button
        type="button"
        className="btn btn-icon"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>
      {open && (
        <div className="kebab-menu" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`kebab-item${item.danger ? ' is-danger' : ''}`}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
