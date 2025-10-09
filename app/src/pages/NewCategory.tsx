import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { OptimizedFileUpload } from '../components/OptimizedFileUpload'

type HeadCategory = {
  id: number
  name: string
  slug: string
  type: string | null
}

function NewCategory() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'haken' | 'borduren' | ''>('')
  const [headimage, setHeadimage] = useState<File | null>(null)
  const [headcategoryId, setHeadcategoryId] = useState<number | ''>('')
  const [headcategories, setHeadcategories] = useState<HeadCategory[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [belongsToHeadcategory, setBelongsToHeadcategory] = useState<boolean | null>(null)

  const slugFromName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  useEffect(() => {
    let cancelled = false
    async function loadHeadcategories() {
      try {
        const res = await apiFetch('/headcategories')
        const json = await res.json()
        if (!res.ok) return
        if (!cancelled) setHeadcategories(json)
      } catch {}
    }
    loadHeadcategories()
    return () => { cancelled = true }
  }, [])

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
      
      const res = await apiFetch('/categories', {
        method: 'POST',
        body: form
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Create failed')
      navigate('/admin')
    } catch (e: any) {
      setError(e.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container">
      <h1 className="title">New Category</h1>
      
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
              <OptimizedFileUpload
                onFileSelect={(file) => setHeadimage(file)}
                onFilesChange={(files) => setHeadimage(files[0] || null)}
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
              {saving ? 'Creating…' : 'Create Category'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  )
}

export default NewCategory
