import { apiUrl } from '../lib/api'
import { useState } from 'react'

function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setUrl(null)
    if (!file) { setError('Choose a file first'); return }
    try {
      setUploading(true)
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(apiUrl('/upload'), { method: 'POST', body: form, credentials: 'include' })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Upload failed')
        return
      }
      setUrl(json.url)
    } catch (err) {
      setError('Unexpected error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container">
      <h1 className="title">Upload Image</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button className="btn" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
        </form>
        {error && <p style={{ color: '#dc2626', marginTop: 12 }}>{error}</p>}
        {url && (
          <div style={{ marginTop: 16 }}>
            <p>Uploaded URL:</p>
            <a href={url} target="_blank" rel="noreferrer">{url}</a>
            <div style={{ marginTop: 12 }}>
              <img src={url} alt="uploaded" style={{ maxWidth: '100%', borderRadius: 8 }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Upload


