import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import ActivityCard from '../components/ActivityCard'

type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  type: string | null
  headimageurl: string | null
  created_at: string
}

type Item = {
  id: number
  name: string
  price: number | null
  images: string[] | null
  created_at: string
}

function Admin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [recentItems, setRecentItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Load categories
        const catsRes = await apiFetch('/categories')
        const catsData = await catsRes.json()
        if (!catsRes.ok) throw new Error(catsData?.error || 'Failed to load categories')
        
        // Load recent items
        const itemsRes = await apiFetch('/items')
        const itemsData = await itemsRes.json()
        if (!itemsRes.ok) throw new Error(itemsData?.error || 'Failed to load items')
        
        if (!cancelled) {
          setCategories(catsData)
          setRecentItems(itemsData.slice(0, 6)) // Show 6 most recent
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Combine and sort recent items and categories by created_at
  const recentActivity = [
    ...recentItems.map(item => ({ ...item, type: 'item' as const })),
    ...categories.slice(0, 3).map(cat => ({ ...cat, type: 'category' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8)

  return (
    <div className="container">
      <h1 className="title">Admin Dashboard</h1>
      
      
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      
      {!loading && !error && (
        <>
          {/* Recently Added Section */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500">No activity yet.</p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentActivity.map((activity) => (
                <ActivityCard
                  key={`${activity.type}-${activity.id}`}
                  type={activity.type}
                  id={activity.id}
                  name={activity.name}
                  slug={activity.type === 'category' ? activity.slug : undefined}
                  description={activity.type === 'category' ? activity.description : undefined}
                  craftType={activity.type === 'category' ? activity.type : undefined}
                  price={activity.type === 'item' ? activity.price : undefined}
                  images={activity.type === 'item' ? activity.images : undefined}
                  headimageurl={activity.type === 'category' ? activity.headimageurl : undefined}
                  showCraftType={false}
                />
              ))}
            </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="font-semibold text-lg">{cat.name}</div>
                  <div className="text-sm text-gray-500 mb-3">{cat.slug}</div>
                  <div className="flex gap-2">
                    <Link className="btn" to={`/admin/categories/${cat.id}/items`}>View Category</Link>
                    <Link className="btn" to={`/admin/items/new?category=${cat.id}`}>Add Item</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Admin


