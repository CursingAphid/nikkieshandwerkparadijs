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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
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

  // Drag and drop functions for image reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newImages = [...images]
    const draggedItem = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(dropIndex, 0, draggedItem)
    setImages(newImages)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
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

          {/* Image Preview with Drag & Drop Reordering */}
          {images.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label className="label">Uploaded Images (drag to reorder)</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: 8,
                marginTop: 8
              }}>
                {images.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      position: 'relative',
                      cursor: 'move',
                      opacity: draggedIndex === index ? 0.5 : 1,
                      border: draggedIndex === index ? '2px dashed #3b82f6' : '2px solid transparent',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(220, 38, 38, 0.8)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        opacity: 1,
                        zIndex: 10
                      }}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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


