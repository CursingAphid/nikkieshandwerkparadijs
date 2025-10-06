import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, apiUrl } from '../lib/api'

type Item = {
  id: string
  name: string
  description: string | null
  price: number | null
  images: string[] | null
  created_at: string
}

function EditItem() {
  const { id } = useParams()
  const [item, setItem] = useState<Item | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [newImages, setNewImages] = useState<File[]>([])
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([])
  const [selectedCats, setSelectedCats] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch(`/items/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load item')
        if (cancelled) return
        setItem(json)
        setName(json.name || '')
        
        setPrice(json.price == null ? '' : String(json.price))
        // load item categories
        const catsRes = await apiFetch(`/items/${id}/categories`)
        const cats = await catsRes.json()
        if (Array.isArray(cats)) setSelectedCats(cats.map((c: any) => c.id))
        const allRes = await apiFetch('/categories')
        const all = await allRes.json()
        if (Array.isArray(all)) setCategories(all)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load item')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      setSaving(true)
      const form = new FormData()
      form.append('name', name)
      form.append('price', price)
      for (const f of newImages) form.append('images', f)
      form.append('categoryIds', JSON.stringify(selectedCats))
      const res = await fetch(apiUrl(`/items/${id}`), { method: 'PATCH', body: form, credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Update failed')
      setItem(json)
      setNewImages([])
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteImage(url: string) {
    if (!item) return
    const ok = confirm('Afbeelding verwijderen?')
    if (!ok) return
    try {
      const endpoint = apiUrl(`/items/${item.id}/images?url=${encodeURIComponent(url)}`)
      const res = await fetch(endpoint, { method: 'DELETE', credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Verwijderen mislukt')
      setItem(json)
    } catch (e: any) {
      alert(e.message || 'Verwijderen mislukt')
    }
  }

  if (loading) return <div className="container"><p>Loading…</p></div>
  if (error) return <div className="container"><p style={{ color: '#dc2626' }}>{error}</p></div>
  if (!item) return <div className="container"><p>Not found</p></div>

  return (
    <div className="container">
      <h1 className="title">Edit Item</h1>
      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={onSave}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Name *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label className="label">Price</label>
            <input className="input" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Add Images</label>
            <input type="file" accept="image/*" multiple onChange={e => setNewImages(Array.from(e.target.files || []))} />
          </div>
          {categories.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label className="label">Categories</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {categories.map((c) => (
                  <label key={c.id} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedCats.includes(c.id)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setSelectedCats((prev) => checked ? [...prev, c.id] : prev.filter((x) => x !== c.id))
                      }}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </form>

        {Array.isArray(item.images) && item.images.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p>Existing images</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {item.images.map((u) => (
                <div key={u} className="group relative rounded-lg overflow-hidden">
                  <img src={u} alt="img" className="block w-full" />
                  <button
                    type="button"
                    aria-label="Delete image"
                    onClick={() => onDeleteImage(u)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditItem


