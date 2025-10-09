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
  const [headcategoryImages, setHeadcategoryImages] = useState<{[key: number]: string[]}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch('/headcategories')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load headcategories')
        if (!cancelled) {
          setHeadcategories(json)
          
          // Load first item image from each subcategory for each headcategory
          const imagePromises = json.map(async (headcat: HeadCategory) => {
            try {
              // Get categories for this headcategory
              const categoriesRes = await apiFetch(`/headcategories/${headcat.id}/categories`)
              const categoriesJson = await categoriesRes.json()
              
              if (categoriesRes.ok && categoriesJson.length > 0) {
                // Get first item from each subcategory
                const subcategoryImagePromises = categoriesJson.map(async (category: any) => {
                  try {
                    const itemsRes = await apiFetch(`/categories/${category.id}/items`)
                    const itemsJson = await itemsRes.json()
                    
                    if (itemsRes.ok && itemsJson.length > 0) {
                      const firstItem = itemsJson[0]
                      const firstImage = Array.isArray(firstItem.images) && firstItem.images.length > 0 
                        ? firstItem.images[0] 
                        : null
                      return firstImage
                    }
                  } catch (e) {
                    console.error(`Failed to load items for category ${category.id}`, e)
                  }
                  return null
                })
                
                const subcategoryImages = await Promise.all(subcategoryImagePromises)
                const validImages = subcategoryImages.filter(img => img !== null) as string[]
                
                return { headcategoryId: headcat.id, images: validImages }
              }
            } catch (e) {
              console.error(`Failed to load images for headcategory ${headcat.id}`, e)
            }
            return { headcategoryId: headcat.id, images: [] }
          })
          
          const imageResults = await Promise.all(imagePromises)
          const imageMap: {[key: number]: string[]} = {}
          imageResults.forEach(result => {
            imageMap[result.headcategoryId] = result.images
          })
          
          if (!cancelled) {
            setHeadcategoryImages(imageMap)
          }
        }
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
              {headcategories.map((headcat) => {
                const images = headcategoryImages[headcat.id] || []
                return (
                  <ActivityCard
                    key={headcat.id}
                    type="headcategory"
                    id={headcat.id}
                    name={headcat.name}
                    slug={headcat.slug}
                    description={headcat.description}
                    images={images.length > 0 ? images : (headcat.headimageurl ? [headcat.headimageurl] : undefined)}
                    viewHref={`/admin/headcategories/${headcat.id}/categories`}
                    useIcons
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminHeadCategories
