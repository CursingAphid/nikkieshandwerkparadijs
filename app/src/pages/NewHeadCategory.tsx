import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'

function NewHeadCategory() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'haken' | 'borduren' | ''>('')
  const [headimage, setHeadimage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slugFromName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

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
      
      const res = await apiFetch('/headcategories', {
        method: 'POST',
        body: form
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Create failed')
      navigate('/admin/headcategories')
    } catch (e: any) {
      setError(e.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container">
      <h1 className="title">New Head Category</h1>
      
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
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setHeadimage(e.target.files?.[0] || null)}
                className="input"
              />
            </div>
            <button className="btn" disabled={saving}>
              {saving ? 'Creating...' : 'Create Head Category'}
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

export default NewHeadCategory
