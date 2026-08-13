import { useEffect } from 'react'

/** Fires `onOutside` on click or Escape outside `ref`. Used by KebabMenu. */
export function useOutsideClick(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined

    function handlePointer(event) {
      if (ref.current && !ref.current.contains(event.target)) onOutside()
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
  }, [ref, onOutside, active])
}
