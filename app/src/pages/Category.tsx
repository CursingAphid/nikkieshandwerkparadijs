import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import HakenBanner from '../assets/banners/haken_banner.png'
import BordurenBanner from '../assets/banners/borduren_banner.png'
import { ImageSlideshow } from '../components/ImageSlideshow'

type Item = {
  id: number
  name: string
  description: string | null
  price: number | null
  images: string[] | null
  category_id: number
  created_at: string
  order: number
}

type Category = {
  id: number
  name: string
  slug: string
  headimageurl: string | null
  description: string | null
  type: string | null
  firstImage?: string | null
  images?: string[]
}

type HeadCategory = {
  id: number
  name: string
  slug: string
  headimageurl: string | null
  description: string | null
  type: string | null
}

function Category() {
  const { type, param1, param2 } = useParams<{ type: string; param1: string; param2?: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [category, setCategory] = useState<Category | HeadCategory | null>(null)
  const [isHeadcategory, setIsHeadcategory] = useState(false)
  const [linkedCategories, setLinkedCategories] = useState<Category[]>([])
  const [headcategory, setHeadcategory] = useState<HeadCategory | null>(null)
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
        // Load both categories and headcategories
        const [catsRes, headcatsRes] = await Promise.all([
          apiFetch('/categories'),
          apiFetch('/headcategories')
        ])
        
        const [catsData, headcatsData] = await Promise.all([
          catsRes.json(),
          headcatsRes.json()
        ])
        
        if (!catsRes.ok) throw new Error(catsData?.error || 'Failed to load categories')
        if (!headcatsRes.ok) throw new Error(headcatsData?.error || 'Failed to load headcategories')
        
        let foundCategory = null
        let isHeadcategory = false
        let foundHeadcategory = null
        
        // Determine URL structure based on parameters
        const isParam1Headcategory = headcatsData.some((hc: HeadCategory) => hc.slug === param1 && hc.type === type)
        
        if (param2) {
          // 3 parameters: /werkjes/type/headcategory/category
          if (isParam1Headcategory) {
            // Find the headcategory first
            foundHeadcategory = headcatsData.find((hc: HeadCategory) => hc.slug === param1 && hc.type === type)
            
            if (foundHeadcategory) {
              // Get categories linked to this headcategory
              const linkedCatsRes = await apiFetch(`/headcategories/${foundHeadcategory.id}/categories`)
              const linkedCatsData = await linkedCatsRes.json()
              
              if (linkedCatsRes.ok) {
                // Find the specific category within this headcategory
                foundCategory = linkedCatsData.find((c: Category) => c.slug === param2)
              }
            }
          }
        } else {
          // 2 parameters: /werkjes/type/param1
          if (isParam1Headcategory) {
            // This is a headcategory page: /werkjes/type/headcategory
            foundCategory = headcatsData.find((hc: HeadCategory) => hc.slug === param1 && hc.type === type)
            foundHeadcategory = foundCategory // Set headcategory to the same data for link generation
            isHeadcategory = true
          } else {
            // URL structure: /werkjes/type/category (standalone category)
            foundCategory = catsData.find((c: Category) => c.slug === param1)
          }
        }
        
        if (!foundCategory) {
          throw new Error('Category not found')
        }

        if (!cancelled) {
          setCategory(foundCategory)
          setIsHeadcategory(isHeadcategory)
          setHeadcategory(foundHeadcategory)
        }

        // Load items for this category/headcategory
        let itemsData = []
        let linkedCatsData = []
        
        if (isHeadcategory) {
          // For headcategories, get linked categories
          const linkedCatsRes = await apiFetch(`/headcategories/${foundCategory.id}/categories`)
          linkedCatsData = await linkedCatsRes.json()
          if (linkedCatsRes.ok && linkedCatsData.length > 0) {
            setLinkedCategories(linkedCatsData)
            
            // Get multiple images from each linked category for display
            const categoryImagePromises = linkedCatsData.map(async (cat: Category) => {
              const itemsRes = await apiFetch(`/categories/${cat.id}/items`)
              const items = await itemsRes.json()
              if (itemsRes.ok && items.length > 0) {
                // Collect images from multiple items in this category
                const categoryImages: string[] = []
                items.forEach((item: any) => {
                  if (Array.isArray(item.images) && item.images.length > 0) {
                    // Take first image from each item
                    categoryImages.push(item.images[0])
                  }
                })
                return { ...cat, firstImage: categoryImages[0] || null, images: categoryImages }
              }
              return { ...cat, firstImage: null, images: [] }
            })
            
            const categoriesWithImages = await Promise.all(categoryImagePromises)
            setLinkedCategories(categoriesWithImages)
          }
        } else {
          // For regular categories, get items directly
          const itemsRes = await apiFetch(`/categories/${foundCategory.id}/items`)
          itemsData = await itemsRes.json()
          if (!itemsRes.ok) throw new Error(itemsData?.error || 'Failed to load items')
        }

        if (!cancelled) {
          // Sort items by order field first, then by creation date (newest first)
          const sortedItems = (itemsData || []).sort((a: Item, b: Item) => {
            // First sort by order (ascending)
            if (a.order !== b.order) {
              return a.order - b.order
            }
            // Then by creation date (newest first)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          setItems(sortedItems)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load category')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [param1, param2])


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

  // Get default banner based on category type
  const getDefaultBanner = () => {
    if (isHeadcategory) {
      return (category as HeadCategory).type === 'haken' ? HakenBanner : BordurenBanner
    }
    return (category as Category).type === 'haken' ? HakenBanner : BordurenBanner
  }

  const bannerImage = category.headimageurl || getDefaultBanner()

  return (
    <div>
      {/* Full-width Banner with Title */}
      <div 
        className="w-full h-48 md:h-64 lg:h-80 flex items-center justify-center relative bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <h1 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center relative z-10" 
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {category.name}
        </h1>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Category Info */}
        <div className="mb-12">
          {category.description && (
            <p className="text-gray-700 text-lg leading-relaxed mb-4 whitespace-pre-wrap">
              {category.description}
            </p>
          )}
          <p className="text-gray-600">
            {isHeadcategory 
              ? `${linkedCategories.length} ${linkedCategories.length === 1 ? 'categorie' : 'categorieën'}`
              : `${items.length} ${items.length === 1 ? 'item' : 'items'}`
            }
          </p>
        </div>

        {/* Content Grid */}
        {isHeadcategory ? (
          // Show linked categories for headcategories
          linkedCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nog geen categorieën in deze collectie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedCategories.map((linkedCategory) => {
                const categoryHref = type ? (headcategory ? `/werkjes/${type}/${headcategory.slug}/${linkedCategory.slug}` : `/werkjes/${type}/${linkedCategory.slug}`) : '#'
                
                return (
                  <Link
                    key={linkedCategory.id}
                    to={categoryHref}
                    className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-[940/788] bg-gray-100 overflow-hidden">
                      {linkedCategory.images && linkedCategory.images.length > 0 ? (
                        <ImageSlideshow
                          images={linkedCategory.images}
                          alt={linkedCategory.name}
                          className="transition-transform duration-300 group-hover:scale-105"
                          autoPlay={true}
                          autoPlayInterval={3000}
                          showDots={true}
                          showArrows={true}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Geen afbeelding
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {linkedCategory.name}
                      </h3>
                      {linkedCategory.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 whitespace-pre-wrap">
                          {linkedCategory.description}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        ) : (
          // Show items for regular categories
          items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nog geen items in deze categorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const itemHref = type ? (headcategory ? `/werkjes/${type}/${headcategory.slug}/${category.slug}/${slugify(item.name)}` : `/werkjes/${type}/${category.slug}/${slugify(item.name)}`) : '#'
                
                return (
                  <Link
                    key={item.id}
                    to={itemHref}
                    className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-[940/788] bg-gray-100 overflow-hidden">
                      <ImageSlideshow
                        images={Array.isArray(item.images) ? item.images : []}
                        alt={item.name}
                        className="transition-transform duration-300 group-hover:scale-105"
                        autoPlay={true}
                        autoPlayInterval={4000}
                        showDots={true}
                        showArrows={true}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {item.name}
                      </h3>
                      {item.price != null ? (
                        <div className="text-green-600 font-medium">
                          €{item.price.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-gray-600 font-medium">
                          Prijs in overleg
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default Category

