import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { OptimizedFileUpload } from '../components/OptimizedFileUpload'

type HeadCategory = {
  id: number
  name: string
  slug: string
  description: string | null
  type: string | null
  headimageurl: string | null
  created_at: string 
}

function EditHeadCategory() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [headcategory, setHeadcategory] = useState<HeadCategory | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'haken' | 'borduren' | ''>('')
  const [headimage, setHeadimage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const slugFromName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch(`/headcategories/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load headcategory')
        if (!cancelled) {
          setHeadcategory(json)
          setName(json.name)
          setDescription(json.description || '')
          setType(json.type || '')
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load headcategory')
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
      form.append('slug', slugFromName)
      form.append('description', description)
      form.append('type', type)
      if (headimage) form.append('headimage', headimage)
      
      const res = await apiFetch(`/headcategories/${id}`, {
        method: 'PATCH',
        body: form
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Update failed')
      navigate('/admin/headcategories')
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container"><p>Loading...</p></div>
  if (error) return <div className="container"><p className="text-red-600">{error}</p></div>
  if (!headcategory) return <div className="container"><p>Head category not found</p></div>

  return (
    <div className="container">
      <h1 className="title">Edit Head Category</h1>
      
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
              {headcategory.headimageurl && (
                <div className="mb-2">
                  <img 
                    src={headcategory.headimageurl} 
                    alt="Current head image" 
                    className="w-32 h-32 object-cover rounded"
                  />
                  <p className="text-sm text-gray-600 mt-1">Current image</p>
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
              <p className="text-sm text-gray-600 mt-1">
                {headimage ? 'New image selected' : 'Leave empty to keep current image'}
              </p>
            </div>
            <button className="btn" disabled={saving}>
              {saving ? 'Updating...' : 'Update Head Category'}
            </button>
          </div>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default EditHeadCategory
