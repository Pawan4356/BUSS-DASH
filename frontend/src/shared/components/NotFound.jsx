import { Link, useNavigate } from 'react-router-dom'
import { BackIcon } from './BackIcon'

/**
 * 404 screen — used for unmatched routes and for detail pages whose record
 * no longer exists (deleted, wrong business, or a mistyped link).
 */
export function NotFound({
  title = 'Page not found',
  description = 'The page you’re looking for doesn’t exist or may have been moved.',
  backTo = '/',
  backLabel = 'Go to Staff Directory',
}) {
  const navigate = useNavigate()

  return (
    <div className="not-found">
      <div className="not-found-code" aria-hidden="true">
        404
      </div>
      <h1 className="page-title not-found-title">{title}</h1>
      <p className="not-found-text">{description}</p>
      <div className="cluster not-found-actions">
        <button type="button" className="btn" onClick={() => navigate(-1)}>
          <BackIcon />
          Go back
        </button>
        <Link to={backTo} className="btn btn-primary">
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
