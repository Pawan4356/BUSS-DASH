import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Moves a `.slide-indicator` child of the returned ref's element onto the
 * child matching `activeSelector`, so switching items glides rather than
 * jumps. Position goes out as CSS variables; the stylesheet does the motion.
 * Used by the sidebar nav and Tabs.
 */
export function useSlidingIndicator(activeSelector) {
  const ref = useRef(null)

  function place() {
    const container = ref.current
    if (!container) return
    const active = container.querySelector(activeSelector)
    const style = container.style
    if (!active) {
      style.setProperty('--ind-o', '0')
      return
    }
    style.setProperty('--ind-x', `${active.offsetLeft}px`)
    style.setProperty('--ind-y', `${active.offsetTop}px`)
    style.setProperty('--ind-w', `${active.offsetWidth}px`)
    style.setProperty('--ind-h', `${active.offsetHeight}px`)
    style.setProperty('--ind-o', '1')
    // Skip the transition on first placement so it doesn't slide in from 0,0.
    if (!container.dataset.indReady) requestAnimationFrame(() => (container.dataset.indReady = 'true'))
  }

  // Re-measure after every render: the active item may have changed.
  useLayoutEffect(place)

  // Also follow size changes, and active-state changes made by children that
  // re-render on their own (e.g. NavLink on a route change) without the owner.
  useEffect(() => {
    const container = ref.current
    if (!container) return undefined
    const resizeObserver = new ResizeObserver(() => place())
    resizeObserver.observe(container)
    const mutationObserver = new MutationObserver(() => place())
    mutationObserver.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'aria-pressed'],
    })
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ref
}
