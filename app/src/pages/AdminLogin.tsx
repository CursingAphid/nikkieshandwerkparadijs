import { apiFetch } from '../lib/api'
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await apiFetch('/admin/me')
        const json = await res.json()
        if (json?.authed && !cancelled) {
          navigate('/admin', { replace: true })
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await apiFetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const json = await res.json()
    if (!res.ok) { setError(json?.error || 'Login failed'); return }
    const redirectTo = (location.state as any)?.redirectTo || '/admin'
    navigate(redirectTo, { replace: true })
  }

  if (checking) return <div className="container"><p>Checking…</p></div>

  return (
    <div className="container">
      <h1 className="title">Admin Login</h1>
      <div className="card" style={{ maxWidth: 420 }}>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Username</label>
            <input className="input" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn">Login</button>
        </form>
        {error && <p style={{ color: '#dc2626', marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  )
}

export default AdminLogin


