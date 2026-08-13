export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="stack">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="cluster" key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <div className="skeleton-line" style={{ flex: 1 }} key={c} />
          ))}
        </div>
      ))}
    </div>
  )
}
