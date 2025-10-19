import { apiUrl } from '../lib/api'
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { OptimizedFileUpload } from '../components/OptimizedFileUpload'
import { useNavigate } from 'react-router-dom'

function NewItem() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [categories, setCategories] = useState<{ id: number, name: string, type: string | null }[]>([])
  const [selectedCats, setSelectedCats] = useState<number[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all') // 'all', 'haken', 'borduren'
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
      form.append('description', description)
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

  // Filter categories based on selected type
  const filteredCategories = categories.filter(cat => {
    if (typeFilter === 'all') return true
    return cat.type === typeFilter
  })

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
            <textarea 
              className="input" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
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
              
              {/* Type Filter */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '14px', fontWeight: '500' }}>
                  Filter by type:
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="typeFilter"
                      value="all"
                      checked={typeFilter === 'all'}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    />
                    All Categories
                  </label>
                  <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="typeFilter"
                      value="haken"
                      checked={typeFilter === 'haken'}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    />
                    Haken Only
                  </label>
                  <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="typeFilter"
                      value="borduren"
                      checked={typeFilter === 'borduren'}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    />
                    Borduren Only
                  </label>
                </div>
              </div>

              {/* Categories List */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {filteredCategories.map((c) => (
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


