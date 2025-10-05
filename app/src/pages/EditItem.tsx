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
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [newImages, setNewImages] = useState<File[]>([])
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
        setDescription(json.description || '')
        setPrice(json.price == null ? '' : String(json.price))
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
      form.append('description', description)
      form.append('price', price)
      for (const f of newImages) form.append('images', f)
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
            <label className="label">Description</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Price</label>
            <input className="input" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Add Images</label>
            <input type="file" accept="image/*" multiple onChange={e => setNewImages(Array.from(e.target.files || []))} />
          </div>
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </form>

        {Array.isArray(item.images) && item.images.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p>Existing images</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {item.images.map((u) => (
                <img key={u} src={u} alt="img" style={{ width: '100%', borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditItem


