import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import ActivityCard from '../components/ActivityCard'

type HeadCategory = {
  id: number
  name: string
  slug: string
  description: string | null
  type: string | null
  headimageurl: string | null
  created_at: string 
}

function AdminHeadCategories() {
  const [headcategories, setHeadcategories] = useState<HeadCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch('/headcategories')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load headcategories')
        if (!cancelled) setHeadcategories(json)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load headcategories')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="title">Head Categories</h1>
        <Link className="btn" to="/admin/headcategories/new">
          New Head Category
        </Link>
      </div>
      
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      
      {!loading && !error && (
        <div className="card">
          {headcategories.length === 0 ? (
            <p className="text-gray-500">No head categories found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {headcategories.map((headcat) => (
                <ActivityCard
                  key={headcat.id}
                  type="headcategory"
                  id={headcat.id}
                  name={headcat.name}
                  slug={headcat.slug}
                  description={headcat.description}
                  headimageurl={headcat.headimageurl}
                  viewHref={`/admin/headcategories/${headcat.id}/categories`}
                  useIcons
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminHeadCategories
