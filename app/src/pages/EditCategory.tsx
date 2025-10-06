import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'

type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  type: string | null
  headimageurl: string | null
  created_at: string
}

function EditCategory() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'crochet' | 'embroidery' | ''>('')
  const [headimage, setHeadimage] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const slugFromName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch('/categories')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load categories')
        
        const category = json.find((c: Category) => c.id === Number(id))
        if (!category) throw new Error('Category not found')
        
        if (!cancelled) {
          setName(category.name)
          setSlug(category.slug)
          setDescription(category.description || '')
          setType(category.type as 'crochet' | 'embroidery' || '')
          setCurrentImageUrl(category.headimageurl)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load category')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      setSaving(true)
      const form = new FormData()
      form.append('name', name)
      form.append('slug', slug || slugFromName)
      form.append('description', description)
      form.append('type', type)
      if (headimage) form.append('headimage', headimage)
      
      const res = await apiFetch(`/categories/${id}`, {
        method: 'PATCH',
        body: form
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Update failed')
      navigate('/admin/categories')
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function onRemoveHeadImage() {
    if (!id) return
    const ok = confirm('Hoofdafbeelding verwijderen?')
    if (!ok) return
    try {
      const res = await apiFetch(`/categories/${id}/headimage`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Verwijderen mislukt')
      setCurrentImageUrl(null)
    } catch (e: any) {
      alert(e.message || 'Verwijderen mislukt')
    }
  }

  if (loading) return <div className="container"><p>Loading…</p></div>
  if (error) return <div className="container"><p className="text-red-600">{error}</p></div>

  return (
    <div className="container">
      <h1 className="title">Edit Category</h1>
      
      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label className="label">Name</label>
              <input 
                className="input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="label">Slug</label>
              <input 
                className="input" 
                value={slug} 
                onChange={(e) => setSlug(e.target.value)} 
                placeholder={slugFromName} 
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select 
                className="input" 
                value={type} 
                onChange={(e) => setType(e.target.value as 'crochet' | 'embroidery' | '')}
                required
              >
                <option value="">Select type...</option>
                <option value="crochet">Crochet</option>
                <option value="embroidery">Embroidery</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea 
                className="input" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="label">Head Image</label>
              {currentImageUrl && (
                <div className="mb-2 group relative inline-block">
                  <img src={currentImageUrl} alt="Current" className="w-32 h-32 object-cover rounded" />
                  <button
                    type="button"
                    aria-label="Delete head image"
                    onClick={onRemoveHeadImage}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setHeadimage(e.target.files?.[0] || null)}
                className="input"
              />
            </div>
            <button className="btn" disabled={saving}>
              {saving ? 'Updating…' : 'Update Category'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  )
}

export default EditCategory
