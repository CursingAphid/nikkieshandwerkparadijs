import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Props = { children: ReactNode }

function RequireAdmin({ children }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch('/api/admin/me')
        const json = await res.json()
        if (cancelled) return
        if (json?.authed) setAuthed(true)
        else {
          setAuthed(false)
          navigate('/admin/login', { replace: true, state: { redirectTo: location.pathname } })
        }
      } catch {
        if (!cancelled) {
          setAuthed(false)
          navigate('/admin/login', { replace: true, state: { redirectTo: location.pathname } })
        }
      }
    }
    check()
    return () => { cancelled = true }
  }, [navigate, location.pathname])

  if (authed === null) return <div className="container"><p>Checking…</p></div>
  if (!authed) return null
  return <>{children}</>
}

export default RequireAdmin


