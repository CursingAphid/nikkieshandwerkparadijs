import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

type Item = {
  id: number
  name: string
  description: string | null
  price: number | null
  images: string[] | null
  category_id: number
  created_at: string
}

type Category = {
  id: number
  name: string
  slug: string
  headimageurl: string | null
  description: string | null
  type: string | null
}

function Category() {
  const { type, categorySlug } = useParams<{ type: string; categorySlug: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to create slug from name
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Load all categories
        const catsRes = await apiFetch('/categories')
        const catsData = await catsRes.json()
        if (!catsRes.ok) throw new Error(catsData?.error || 'Failed to load categories')
        
        // Find the category by slug
        const foundCategory = catsData.find((c: Category) => c.slug === categorySlug)
        if (!foundCategory) {
          throw new Error('Category not found')
        }

        // Load items in this category
        const itemsRes = await apiFetch(`/categories/${foundCategory.id}/items`)
        const itemsData = await itemsRes.json()
        if (!itemsRes.ok) throw new Error(itemsData?.error || 'Failed to load items')

        if (!cancelled) {
          setCategory(foundCategory)
          setItems(itemsData)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load category')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [categorySlug])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p>Loading…</p>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-600">{error || 'Category not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back to Home
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Full-width Banner */}
      {category.headimageurl && (
        <div className="w-full h-48 md:h-64 lg:h-80 overflow-hidden">
          <img
            src={category.headimageurl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Container */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Category Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              {category.description}
            </p>
          )}
          <p className="text-gray-600">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nog geen items in deze categorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const first = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null
              const itemHref = type ? `/werkjes/${type}/${categorySlug}/${slugify(item.name)}` : '#'
              
              return (
                <Link
                  key={item.id}
                  to={itemHref}
                  className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-[940/788] bg-gray-100 overflow-hidden">
                    {first ? (
                      <img
                        src={first}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Geen afbeelding
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    {item.price != null && (
                      <div className="text-green-600 font-medium">
                        €{item.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Category

