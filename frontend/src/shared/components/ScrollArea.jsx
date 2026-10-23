import { useEffect, useRef, useState } from 'react'

/**
 * Scrollable box with edge shadows. Scrollbars are hidden app-wide, so the
 * shadows are the cue that there's more content: top shadow once scrolled
 * down, bottom shadow while more remains below. They're overlay layers on the
 * wrapper (not backgrounds), so they sit above rows, avatars and badges.
 *
 * `className` styles the outer box (e.g. "card"); `bodyClassName` the
 * scrolling content (e.g. "stack").
 */
export function ScrollArea({ maxHeight, className = '', bodyClassName = '', children }) {
  const bodyRef = useRef(null)
  const [edges, setEdges] = useState({ top: false, bottom: false })

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return undefined

    const update = () => {
      const top = el.scrollTop > 1
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1
      setEdges((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }))
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    // Box resizes (window, layout) and content changes (data loads) both
    // change whether there's anything to scroll.
    const resize = new ResizeObserver(update)
    resize.observe(el)
    const mutations = new MutationObserver(update)
    mutations.observe(el, { childList: true, subtree: true })

    return () => {
      el.removeEventListener('scroll', update)
      resize.disconnect()
      mutations.disconnect()
    }
  }, [])

  return (
    <div
      className={`scroll-shadow${className ? ` ${className}` : ''}`}
      data-shadow-top={edges.top || undefined}
      data-shadow-bottom={edges.bottom || undefined}
    >
      <div ref={bodyRef} className={`scroll-shadow-body${bodyClassName ? ` ${bodyClassName}` : ''}`} style={{ maxHeight }}>
        {children}
      </div>
    </div>
  )
}
