import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

type Item = {
  id: number
  name: string
  price: number | null
  images: string[] | null
  created_at: string
}

type ItemWithFlags = Item & {
  is_favorite?: boolean
  featured_haken?: boolean
  featured_borduren?: boolean
  featured_order_haken?: number
  featured_order_borduren?: number
}

function AdminItems() {
  const [items, setItems] = useState<ItemWithFlags[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const featuredCount = (type: 'haken' | 'borduren') =>
    items.filter((it) => (type === 'haken' ? it.featured_haken : it.featured_borduren)).length

  const loadItems = async () => {
    try {
      const res = await apiFetch('/items')
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load items')
      setItems(json)
    } catch (e: any) {
      setError(e.message || 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadItems()
  }, [])

  return (
    <div className="container">
      <h1 className="title">Alle items</h1>
      <div className="mt-2 text-sm text-gray-600">Nieuwste Haken: {featuredCount('haken')} / 10 · Nieuwste Borduren: {featuredCount('borduren')} / 10</div>
      
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      
      {!loading && !error && (
        <div className="card">
          {items.length === 0 ? (
            <p className="text-gray-500">No items found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="relative group p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  {/* Favorite star toggle */}
                  <button
                    type="button"
                    aria-label={(item as any).is_favorite ? 'Verwijder favoriet' : 'Markeer als favoriet'}
                    className="absolute top-2 right-2"
                    onClick={async () => {
                      const next = !(item as any).is_favorite
                      const currentFavs = items.filter((it) => (it as any).is_favorite).length
                      if (next && currentFavs >= 3) {
                        alert('Maximaal 3 favorieten toegestaan')
                        return
                      }
                      const form = new FormData()
                      form.append('is_favorite', String(next))
                      const res = await apiFetch(`/items/${item.id}`, {
                        method: 'PATCH',
                        body: form,
                      })
                      const json = await res.json()
                      if (!res.ok) { alert(json?.error || 'Opslaan mislukt'); return }
                      await loadItems()
                    }}
                  >
                    {(item as any).is_favorite ? (
                      // filled star (always visible when favorite)
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#facc15" className="h-6 w-6 drop-shadow-sm">
                        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                    ) : (
                      // outline star (only visible on hover)
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                    )}
                  </button>
                  {/* Featured toggles */}
                  <div className="absolute top-10 right-2 flex flex-col gap-1 z-10">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded text-xs border w-20 ${item.featured_haken ? 'bg-green-600 text-white border-green-700' : 'bg-white text-green-700 border-green-600'}`}
                      onClick={async () => {
                        const next = !item.featured_haken
                        if (next && featuredCount('haken') >= 10) { alert('Maximaal 10 uitgelichte items voor Haken'); return }
                        const form = new FormData()
                        form.append('featured_haken', String(next))
                        const res = await apiFetch(`/items/${item.id}`, { method: 'PATCH', body: form })
                        const json = await res.json()
                        if (!res.ok) { alert(json?.error || 'Opslaan mislukt'); return }
                        await loadItems()
                      }}
                    >
                      Haken
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded text-xs border w-20 ${item.featured_borduren ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-600'}`}
                      onClick={async () => {
                        const next = !item.featured_borduren
                        if (next && featuredCount('borduren') >= 10) { alert('Maximaal 10 uitgelichte items voor Borduren'); return }
                        const form = new FormData()
                        form.append('featured_borduren', String(next))
                        const res = await apiFetch(`/items/${item.id}`, { method: 'PATCH', body: form })
                        const json = await res.json()
                        if (!res.ok) { alert(json?.error || 'Opslaan mislukt'); return }
                        await loadItems()
                      }}
                    >
                      Borduren
                    </button>
                  </div>
                  <div className="font-semibold text-lg mb-2">{item.name}</div>
                  {(item.featured_haken || item.featured_borduren) && (
                    <div className="text-xs text-gray-500 mb-2">
                      {item.featured_haken && `Haken #${item.featured_order_haken} `}
                      {item.featured_borduren && `Borduren #${item.featured_order_borduren}`}
                    </div>
                  )}
                  {item.price !== null && (
                    <div className="text-lg font-medium text-green-600 mb-2">
                      €{item.price.toFixed(2)}
                    </div>
                  )}
                  {Array.isArray(item.images) && item.images.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {item.images.slice(0, 3).map((url) => (
                        <img 
                          key={url} 
                          src={url} 
                          alt="item" 
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <Link className="btn" to={`/admin/items/${item.id}/edit`}>
                      Bewerken
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminItems
