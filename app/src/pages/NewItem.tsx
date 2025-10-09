import { apiUrl } from '../lib/api'
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { OptimizedFileUpload } from '../components/OptimizedFileUpload'
import { useNavigate } from 'react-router-dom'

function NewItem() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([])
  const [selectedCats, setSelectedCats] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Name is required'); return }
    try {
      setSubmitting(true)
      const form = new FormData()
      form.append('name', name)
      form.append('price', price)
      for (const f of images) form.append('images', f)
      if (selectedCats.length > 0) form.append('categoryIds', JSON.stringify(selectedCats))
      const res = await fetch(apiUrl('/items'), { method: 'POST', body: form, credentials: 'include' })
      const json = await res.json()
      if (!res.ok) { setError(json?.error || 'Create failed'); return }
      navigate('/admin')
    } catch (err) {
      setError('Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function loadCats() {
      try {
        const res = await apiFetch('/categories')
        const json = await res.json()
        if (!res.ok) return
        if (!cancelled) setCategories(json)
      } catch {}
    }
    loadCats()
    return () => { cancelled = true }
  }, [])

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
            <label className="label">Price</label>
            <input className="input" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Images</label>
            <OptimizedFileUpload
              onMultipleFilesSelect={(files) => setImages(prev => [...prev, ...files])}
              onFilesChange={(files) => setImages(files)}
              multiple={true}
              maxSizeMB={5}
              optimizationOptions={{
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 0.8,
                format: 'jpeg'
              }}
            />
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
          <button className="btn" disabled={submitting}>{submitting ? 'Saving...' : 'Create Item'}</button>
        </form>
        {error && <p style={{ color: '#dc2626', marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  )
}

export default NewItem


