/** Toolbar search field with a leading magnifier icon. */
export function SearchInput({ value, onChange, placeholder = 'Search…', ariaLabel }) {
  return (
    <label className="search">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.5-4.5" />
      </svg>
      <input
        className="input"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
