import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOutsideClick } from './useOutsideClick'

const GAP = 6
const EDGE = 8

/**
 * Row-actions kebab menu (spec §4): View details / Edit / Delete, or any
 * caller-supplied item list. Each item: { label, onClick, danger?, disabled? }.
 *
 * The menu is portalled to <body> with fixed positioning so scrolling
 * containers (e.g. .table-wrap) can't clip it, and it opens upward when
 * there isn't room below the button.
 */
export function KebabMenu({ items, ariaLabel = 'Row actions' }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const ref = useRef(null)
  const menuRef = useRef(null)

  useOutsideClick([ref, menuRef], () => setOpen(false), open)

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    const button = ref.current.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight ?? 0
    const fitsBelow = button.bottom + GAP + menuHeight <= window.innerHeight - EDGE
    const fitsAbove = button.top - GAP - menuHeight >= EDGE
    const dropUp = !fitsBelow && fitsAbove
    setPosition({
      right: Math.max(EDGE, window.innerWidth - button.right),
      ...(dropUp ? { bottom: window.innerHeight - button.top + GAP } : { top: button.bottom + GAP }),
      dropUp,
    })
  }, [open])

  // A fixed menu would drift away from its row, so close on scroll/resize.
  useEffect(() => {
    if (!open) return undefined
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

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
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={`kebab-menu${position?.dropUp ? ' is-up' : ''}`}
            role="menu"
            style={
              position
                ? { top: position.top, bottom: position.bottom, right: position.right }
                : { visibility: 'hidden', top: 0, right: 0 }
            }
          >
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
          </div>,
          document.body,
        )}
    </div>
  )
}
