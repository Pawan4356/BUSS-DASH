import { useEffect } from 'react'

/**
 * Fires `onOutside` on click or Escape outside `refs` (one ref or an array,
 * e.g. a trigger plus a portalled popup). Used by KebabMenu.
 */
export function useOutsideClick(refs, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined
    const list = Array.isArray(refs) ? refs : [refs]

    function handlePointer(event) {
      if (!list.some((ref) => ref.current?.contains(event.target))) onOutside()
    }
    function handleKey(event) {
      if (event.key === 'Escape') onOutside()
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [refs, onOutside, active])
}
