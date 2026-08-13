import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLoginMutation } from '../api/authApi'
import { sessionEstablished } from './authSlice'
import { useToast } from '../shared/components'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [login, { isLoading, error }] = useLoginMutation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { push } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const result = await login({ email, password }).unwrap()
      dispatch(sessionEstablished(result))
      push(`Welcome back, ${result.account.email}`)
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch {
      // surfaced via `error` below
    }
  }

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <form className="card" style={{ padding: 32, width: 340 }} onSubmit={handleSubmit}>
        <h1 style={{ marginTop: 0, fontSize: 18 }}>Sign in to BUSS-DASH</h1>
        {error && (
          <div className="banner banner-danger">
            {error.data?.message ?? 'Invalid email or password.'}
          </div>
        )}
        <div className="field">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
