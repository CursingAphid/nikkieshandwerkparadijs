import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { OptimizedFileUpload } from '../components/OptimizedFileUpload'

type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  type: string | null
  headimageurl: string | null
  created_at: string
}

type HeadCategory = {
  id: number
  name: string
  slug: string
  type: string | null
}

function EditCategory() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'haken' | 'borduren' | ''>('')
  const [headimage, setHeadimage] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [headcategoryId, setHeadcategoryId] = useState<number | ''>('')
  const [headcategories, setHeadcategories] = useState<HeadCategory[]>([])
  const [belongsToHeadcategory, setBelongsToHeadcategory] = useState<boolean | null>(null)

  const slugFromName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Load categories and headcategories in parallel
        const [categoriesRes, headcategoriesRes] = await Promise.all([
          apiFetch('/categories'),
          apiFetch('/headcategories')
        ])
        
        const [categoriesJson, headcategoriesJson] = await Promise.all([
          categoriesRes.json(),
          headcategoriesRes.json()
        ])
        
        if (!categoriesRes.ok) throw new Error(categoriesJson?.error || 'Failed to load categories')
        if (!headcategoriesRes.ok) throw new Error(headcategoriesJson?.error || 'Failed to load headcategories')
        
        const category = categoriesJson.find((c: Category) => c.id === Number(id))
        if (!category) throw new Error('Category not found')
        
        if (!cancelled) {
          setName(category.name)
          setDescription(category.description || '')
          setType(category.type as 'haken' | 'borduren' || '')
          setCurrentImageUrl(category.headimageurl)
          setHeadcategories(headcategoriesJson)
          
          // Check if this category belongs to a headcategory
          // For now, we'll assume it doesn't (this would need backend support to check)
          setBelongsToHeadcategory(false)
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

  // Get the type from selected headcategory or use the manually selected type
  const getFinalType = () => {
    if (belongsToHeadcategory && headcategoryId) {
      const selectedHeadcategory = headcategories.find(hc => hc.id === headcategoryId)
      return selectedHeadcategory?.type || ''
    }
    return type
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    // Validation
    if (belongsToHeadcategory === null) {
      setError('Please select whether this category belongs to a head category')
      return
    }
    
    if (belongsToHeadcategory && !headcategoryId) {
      setError('Please select a head category')
      return
    }
    
    if (!belongsToHeadcategory && !type) {
      setError('Please select a type (Haken or Borduren)')
      return
    }
    
    try {
      setSaving(true)
      const form = new FormData()
      form.append('name', name)
      form.append('slug', slugFromName)
      form.append('description', description)
      form.append('type', getFinalType())
      if (headimage) form.append('headimage', headimage)
      if (headcategoryId) form.append('headcategoryId', String(headcategoryId))
      
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
              <label className="label">Slug (auto-generated)</label>
              <input 
                className="input bg-gray-100" 
                value={slugFromName} 
                readOnly
                placeholder="Will be generated from name"
              />
            </div>
            <div>
              <label className="label">Does this category belong to a head category?</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="belongsToHeadcategory"
                    checked={belongsToHeadcategory === true}
                    onChange={() => {
                      setBelongsToHeadcategory(true)
                      setType('') // Reset type when selecting headcategory
                    }}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="belongsToHeadcategory"
                    checked={belongsToHeadcategory === false}
                    onChange={() => {
                      setBelongsToHeadcategory(false)
                      setHeadcategoryId('') // Reset headcategory when selecting manual type
                    }}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            {belongsToHeadcategory === true && (
              <div>
                <label className="label">Head Category</label>
                <select 
                  className="input" 
                  value={headcategoryId} 
                  onChange={(e) => setHeadcategoryId(e.target.value ? parseInt(e.target.value) : '')}
                  required
                >
                  <option value="">Select head category...</option>
                  {headcategories.map((headcat) => (
                    <option key={headcat.id} value={headcat.id}>
                      {headcat.name} ({headcat.type})
                    </option>
                  ))}
                </select>
                {headcategoryId && (
                  <p className="text-sm text-gray-600 mt-1">
                    Type will be automatically set to: {getFinalType()}
                  </p>
                )}
              </div>
            )}

            {belongsToHeadcategory === false && (
              <div>
                <label className="label">Type</label>
                <select 
                  className="input" 
                  value={type} 
                  onChange={(e) => setType(e.target.value as 'haken' | 'borduren' | '')}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="haken">Haken</option>
                  <option value="borduren">Borduren</option>
                </select>
              </div>
            )}
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
              <OptimizedFileUpload
                onFileSelect={(file) => setHeadimage(file)}
                maxSizeMB={5}
                optimizationOptions={{
                  maxWidth: 1920,
                  maxHeight: 1920,
                  quality: 0.8,
                  format: 'jpeg'
                }}
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
