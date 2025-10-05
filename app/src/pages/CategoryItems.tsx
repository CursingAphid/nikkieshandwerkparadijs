import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'

type Item = {
  id: number
  name: string
  price: number | null
  images: string[] | null
  created_at: string
}

type Category = {
  id: number
  name: string
  slug: string
}

function CategoryItems() {
  const { id } = useParams<{ id: string }>()
  const [items, setItems] = useState<Item[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Load items in this category
        const itemsRes = await apiFetch(`/categories/${id}/items`)
        const itemsData = await itemsRes.json()
        if (!itemsRes.ok) throw new Error(itemsData?.error || 'Failed to load items')
        
        // Load category info
        const catsRes = await apiFetch('/categories')
        const catsData = await catsRes.json()
        if (!catsRes.ok) throw new Error(catsData?.error || 'Failed to load categories')
        
        const currentCategory = catsData.find((c: Category) => c.id === Number(id))
        
        if (!cancelled) {
          setItems(itemsData)
          setCategory(currentCategory)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  return (
    <div className="container">
      <h1 className="title">
        {category ? `Items in ${category.name}` : 'Category Items'}
      </h1>
      
      <div className="mb-4">
        <Link className="btn" to="/admin">← Back to Dashboard</Link>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      
      {!loading && !error && (
        <div className="card">
          {items.length === 0 ? (
            <p className="text-gray-500">No items in this category yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="font-semibold text-lg mb-2">{item.name}</div>
                  {item.price !== null && (
                    <div className="text-lg font-medium text-green-600 mb-2">
                      €{item.price.toFixed(2)}
                    </div>
                  )}
                  {Array.isArray(item.images) && item.images.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {item.images.slice(0, 3).map((url) => (
                        <img 
                          key={url} 
                          src={url} 
                          alt="item" 
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link className="btn" to={`/admin/items/${item.id}/edit`}>
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CategoryItems
