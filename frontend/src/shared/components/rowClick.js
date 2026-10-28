const INTERACTIVE = 'button, a, input, select, textarea, label, [role="menu"], [role="menuitem"]'

/**
 * onClick for a whole table row / card that opens its detail. Clicks on the
 * row's own controls (kebab, name link, inputs) and clicks that finish a text
 * selection are left alone.
 */
export function rowClick(open) {
  return (e) => {
    if (e.target.closest(INTERACTIVE)) return
    if (window.getSelection()?.toString()) return
    open()
  }
}
