import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Item = {
  id: string
  name: string
  description: string | null
  price: number | null
  images: string[] | null
  created_at: string
}

function Admin() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/items')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load items')
        if (!cancelled) setItems(json)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load items')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="container">
      <h1 className="title">Admin</h1>
      <div style={{ marginBottom: 12 }}>
        <Link className="btn" to="/admin/items/new">+ New Item</Link>
      </div>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      {!loading && !error && (
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: 'contents' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{it.name}</div>
                  {it.price !== null && <div>€ {it.price.toFixed(2)}</div>}
                  {Array.isArray(it.images) && it.images.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {it.images.slice(0, 4).map((u) => (
                        <img key={u} src={u} alt="thumb" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6 }} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link className="btn" to={`/admin/items/${it.id}/edit`}>Edit</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin


