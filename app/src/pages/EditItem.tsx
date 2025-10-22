import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch, apiUrl } from '../lib/api'
import { OptimizedFileUpload } from '../components/OptimizedFileUpload'

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
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [newImages, setNewImages] = useState<File[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedExistingIndex, setDraggedExistingIndex] = useState<number | null>(null)
  const [existingImagesOrder, setExistingImagesOrder] = useState<string[]>([])
  const [categories, setCategories] = useState<{ id: number, name: string, type: string | null }[]>([])
  const [selectedCats, setSelectedCats] = useState<number[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all') // 'all', 'haken', 'borduren'
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
        // Initialize existing images order
        if (Array.isArray(json.images)) {
          setExistingImagesOrder([...json.images])
        }
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

    const updatedImages = [...newImages]
    const draggedItem = updatedImages[draggedIndex]
    updatedImages.splice(draggedIndex, 1)
    updatedImages.splice(dropIndex, 0, draggedItem)
    setNewImages(updatedImages)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  // Drag and drop functions for existing images
  const handleExistingDragStart = (e: React.DragEvent, index: number) => {
    setDraggedExistingIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleExistingDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleExistingDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedExistingIndex === null || draggedExistingIndex === dropIndex) return

    const updatedOrder = [...existingImagesOrder]
    const draggedItem = updatedOrder[draggedExistingIndex]
    updatedOrder.splice(draggedExistingIndex, 1)
    updatedOrder.splice(dropIndex, 0, draggedItem)
    setExistingImagesOrder(updatedOrder)
    setDraggedExistingIndex(null)
  }

  const handleExistingDragEnd = () => {
    setDraggedExistingIndex(null)
  }

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
      form.append('categoryIds', JSON.stringify(selectedCats))
      // Send the reordered existing images
      if (existingImagesOrder.length > 0) {
        form.append('existingImagesOrder', JSON.stringify(existingImagesOrder))
      }
      const res = await fetch(apiUrl(`/items/${id}`), { method: 'PATCH', body: form, credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Update failed')
      navigate('/admin')
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
      // Update the existing images order to remove the deleted image
      setExistingImagesOrder(prev => prev.filter(imgUrl => imgUrl !== url))
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
            <label className="label">Add Images</label>
            <OptimizedFileUpload
              onMultipleFilesSelect={(files) => setNewImages(prev => [...prev, ...files])}
              onFilesChange={(files) => setNewImages(files)}
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

          {/* New Images Preview with Drag & Drop Reordering */}
          {newImages.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label className="label">New Images (drag to reorder)</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: 8,
                marginTop: 8
              }}>
                {newImages.map((file, index) => (
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
                      onClick={() => removeNewImage(index)}
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
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </form>

        {existingImagesOrder.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p>Existing images (drag to reorder)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {existingImagesOrder.map((url, index) => (
                <div 
                  key={url} 
                  draggable
                  onDragStart={(e) => handleExistingDragStart(e, index)}
                  onDragOver={handleExistingDragOver}
                  onDrop={(e) => handleExistingDrop(e, index)}
                  onDragEnd={handleExistingDragEnd}
                  style={{
                    position: 'relative',
                    cursor: 'move',
                    opacity: draggedExistingIndex === index ? 0.5 : 1,
                    border: draggedExistingIndex === index ? '2px dashed #3b82f6' : '2px solid transparent',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img src={url} alt="img" className="block w-full" style={{ height: '120px', objectFit: 'cover' }} />
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
                    aria-label="Delete image"
                    onClick={() => onDeleteImage(url)}
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


