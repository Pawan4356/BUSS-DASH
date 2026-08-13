export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state card">
      <div className="empty-state-title">{title}</div>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
