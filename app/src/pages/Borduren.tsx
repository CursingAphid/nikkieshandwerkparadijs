import { useEffect, useState } from 'react';
import BordurenBanner from '../assets/borduren/borduren_banner.png';
import WolligeAchtergrond from '../assets/haken/wollige_achtergrond.png';
import { apiFetch } from '../lib/api';

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
  type: string | null
}

function Borduren() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
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

        // Filter categories with type 'borduren'
        const bordurenCategories = catsData.filter((cat: Category) => cat.type === 'borduren')

        // Load items from all borduren categories
        const allItems: Item[] = []
        for (const cat of bordurenCategories) {
          const itemsRes = await apiFetch(`/categories/${cat.id}/items`)
          const itemsData = await itemsRes.json()
          if (itemsRes.ok) {
            allItems.push(...itemsData)
          }
        }

        // Sort by creation date (newest first) and take the latest 10
        const sortedItems = allItems
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)

        if (!cancelled) {
          setCategories(catsData)
          setItems(sortedItems)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load items')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const getCategoryData = (categoryId: number) => {
    const cat = categories.find(c => c.id === categoryId)
    return {
      slug: cat?.slug || '',
      type: cat?.type || 'borduren'
    }
  }

  return (
    <div>
      {/* Banner Section */}
      <section 
        className="w-full h-48 md:h-64 lg:h-80 flex items-center justify-center"
        style={{ 
          backgroundImage: `url(${BordurenBanner})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          Borduren
        </h1>
      </section>

      {/* Main Content */}
      <div>
        {/* Newest Work Section */}
        <section 
          className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-12 px-4"
          style={{ 
            backgroundImage: `url(${WolligeAchtergrond})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Nieuwste werkjes</h2>
            
            {loading && <p className="text-center text-gray-500">Loading...</p>}
            {error && <p className="text-center text-red-600">{error}</p>}
            
            {!loading && !error && items.length > 0 && (
              <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
                <div className="carousel">
                  <div className="carousel-track">
                  {[...items, ...items].map((item, idx) => {
                    const first = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null
                    const categoryData = getCategoryData(item.category_id)
                    const itemSlug = slugify(item.name)
                    const href = categoryData.slug ? `/werkjes/borduren/${categoryData.slug}/${itemSlug}` : '#'
                    
                    return (
                      <div 
                        key={`${item.id}-${idx}`} 
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md w-56 md:w-64 lg:w-72 flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          if (href !== '#') {
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                            window.location.href = href
                          }
                        }}
                      >
                        <div className="aspect-[940/788] bg-gray-100 overflow-hidden">
                          {first ? (
                            <img src={first} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">Geen afbeelding</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.name}</h3>
                          {item.price != null && (
                            <div className="text-green-600 font-medium">€{item.price.toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </div>
              </div>
            )}
            
            {!loading && !error && items.length === 0 && (
              <p className="text-center text-gray-500">Nog geen borduren items beschikbaar.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Borduren;
