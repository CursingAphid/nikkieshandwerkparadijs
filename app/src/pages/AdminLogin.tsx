import { apiFetch } from '../lib/api'
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        console.log('Checking if user is already authenticated...')
        const res = await apiFetch('/admin/me')
        console.log('Auth check response status:', res.status)
        const json = await res.json()
        console.log('Auth check response data:', json)
        
        if (json?.authed && !cancelled) {
          console.log('User is already authenticated, redirecting to admin')
          navigate('/admin', { replace: true })
        } else {
          console.log('User is not authenticated')
        }
      } catch (err) {
        console.error('Auth check error:', err)
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
    setLoggingIn(true)
    
    try {
      console.log('Attempting login with username:', username)
      const res = await apiFetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      console.log('Login response status:', res.status)
      const json = await res.json()
      console.log('Login response data:', json)
      
      if (!res.ok) { 
        setError(json?.error || 'Login failed'); 
        return 
      }
      
      console.log('Login successful, redirecting to admin dashboard')
      const redirectTo = (location.state as any)?.redirectTo || '/admin'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      setError('Network error during login')
    } finally {
      setLoggingIn(false)
    }
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
          <button className="btn" disabled={loggingIn}>
            {loggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p style={{ color: '#dc2626', marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  )
}

export default AdminLogin


