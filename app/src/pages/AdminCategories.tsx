import { useEffect, useState } from 'react'
// Link not used in this component
import { apiFetch } from '../lib/api'
import ActivityCard from '../components/ActivityCard'

type Category = { 
  id: number; 
  name: string; 
  slug: string; 
  description: string | null;
  type: string | null;
  headimageurl: string | null;
  created_at: string 
}

function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch('/categories')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load categories')
        if (!cancelled) setCategories(json)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load categories')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="container">
      <h1 className="title">Categories</h1>
      
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      
      {!loading && !error && (
        <div className="card">
          {categories.length === 0 ? (
            <p className="text-gray-500">No categories found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <ActivityCard
                  key={cat.id}
                  type="category"
                  id={cat.id}
                  name={cat.name}
                  slug={cat.slug}
                  description={cat.description}
                  craftType={cat.type}
                  headimageurl={cat.headimageurl}
                  viewHref={`/admin/categories/${cat.id}/items`}
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

export default AdminCategories


