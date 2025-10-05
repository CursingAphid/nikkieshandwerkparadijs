import { apiUrl } from '../lib/api'
import { useState } from 'react'

function NewItem() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<any | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCreated(null)
    if (!name.trim()) { setError('Name is required'); return }
    try {
      setSubmitting(true)
      const form = new FormData()
      form.append('name', name)
      form.append('description', description)
      form.append('price', price)
      for (const f of images) form.append('images', f)
      const res = await fetch(apiUrl('/items'), { method: 'POST', body: form, credentials: 'include' })
      const json = await res.json()
      if (!res.ok) { setError(json?.error || 'Create failed'); return }
      setCreated(json)
      setName('')
      setDescription('')
      setPrice('')
      setImages([])
    } catch (err) {
      setError('Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <h1 className="title">New Item</h1>
      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={onSubmit}>
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
            <label className="label">Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => {
                const next = Array.from(e.target.files || [])
                setImages(prev => [...prev, ...next])
              }}
            />
          </div>
          <button className="btn" disabled={submitting}>{submitting ? 'Saving...' : 'Create Item'}</button>
        </form>
        {images.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p>Selected images: {images.length}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {images.map((f, idx) => (
                <img key={`${f.name}-${idx}`} src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}
        {error && <p style={{ color: '#dc2626', marginTop: 12 }}>{error}</p>}
        {created && (
          <div style={{ marginTop: 16 }}>
            <p>Created:</p>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(created, null, 2)}</pre>
            {Array.isArray(created.images) && created.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginTop: 12 }}>
                {created.images.map((u: string) => (
                  <img key={u} src={u} alt="uploaded" style={{ width: '100%', borderRadius: 8 }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NewItem


