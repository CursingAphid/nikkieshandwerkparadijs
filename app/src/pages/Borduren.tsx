import { useEffect, useState, useRef } from 'react';
import BordurenBanner from '../assets/banners/borduren_banner.png';
import WolligeAchtergrond from '../assets/haken/wollige_achtergrond.png';
import { apiFetch } from '../lib/api';
import { Link } from 'react-router-dom';

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
  headcategory_id?: number | null
}

type HeadCategory = {
  id: number
  name: string
  slug: string
  type: string | null
}

function Borduren() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [headcategories, setHeadcategories] = useState<HeadCategory[]>([])
  const [categoryItems, setCategoryItems] = useState<{[key: number]: Item[]}>({})
  const [headcategoryItems, setHeadcategoryItems] = useState<{[key: number]: Item[]}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

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
        // Load categories and headcategories
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

        // Filter categories and headcategories with type 'borduren'
        const bordurenCategories = catsData.filter((cat: Category) => cat.type === 'borduren')
        const bordurenHeadcategories = headcatsData.filter((headcat: HeadCategory) => headcat.type === 'borduren')

        // Load items from all borduren categories
        const allItems: Item[] = []
        const categoryItemsMap: {[key: number]: Item[]} = {}
        
        for (const cat of bordurenCategories) {
          const itemsRes = await apiFetch(`/categories/${cat.id}/items`)
          const itemsData = await itemsRes.json()
          if (itemsRes.ok) {
            // Add category_id to each item
            const itemsWithCategory = itemsData.map((item: any) => ({
              ...item,
              category_id: cat.id
            }))
            allItems.push(...itemsWithCategory)
            categoryItemsMap[cat.id] = itemsWithCategory
          }
        }

        // Load items for headcategories (get linked categories first, then their items)
        const headcategoryItemsMap: {[key: number]: Item[]} = {}
        for (const headcat of bordurenHeadcategories) {
          const linkedCatsRes = await apiFetch(`/headcategories/${headcat.id}/categories`)
          const linkedCatsData = await linkedCatsRes.json()
          if (linkedCatsRes.ok) {
            const headcatItems: Item[] = []
            for (const linkedCat of linkedCatsData) {
              const itemsRes = await apiFetch(`/categories/${linkedCat.id}/items`)
              const itemsData = await itemsRes.json()
              if (itemsRes.ok) {
                const itemsWithCategory = itemsData.map((item: any) => ({
                  ...item,
                  category_id: linkedCat.id
                }))
                headcatItems.push(...itemsWithCategory)
              }
            }
            headcategoryItemsMap[headcat.id] = headcatItems
          }
        }

        // Sort by creation date (newest first) and take the latest 10
        const sortedItems = allItems
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)

        if (!cancelled) {
          setCategories(bordurenCategories)
          setHeadcategories(bordurenHeadcategories)
          setItems(sortedItems)
          setCategoryItems(categoryItemsMap)
          setHeadcategoryItems(headcategoryItemsMap)
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

  // Scroll-based animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px 200px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    if (titleRef.current) {
      observer.observe(titleRef.current);
    }

    return () => {
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
      }
    };
  }, []);


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
        <h1 ref={titleRef} className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center logo-pop-in" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          Borduren
        </h1>
      </section>

      {/* Main Content */}
      <div>
        {/* Categories Section */}
        <section className="py-12 px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Categorieën</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Headcategories */}
              {headcategories.map((headcat) => {
                const headcatItems = headcategoryItems[headcat.id] || []
                const firstItem = headcatItems.length > 0 ? headcatItems[0] : null
                const firstImage = firstItem && Array.isArray(firstItem.images) && firstItem.images.length > 0 ? firstItem.images[0] : null
                
                return (
                  <Link
                    key={headcat.id}
                    to={`/werkjes/borduren/${headcat.slug}`}
                    className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-[940/788] bg-gray-100 overflow-hidden">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={headcat.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Geen afbeelding
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        {headcat.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Bekijk alle categorieën in deze collectie
                      </p>
                    </div>
                  </Link>
                )
              })}
              
              {/* Standalone categories (not linked to headcategories) */}
              {categories
                .filter(cat => !cat.headcategory_id)
                .map((category) => {
                  const catItems = categoryItems[category.id] || []
                  const firstItem = catItems.length > 0 ? catItems[0] : null
                  const firstImage = firstItem && Array.isArray(firstItem.images) && firstItem.images.length > 0 ? firstItem.images[0] : null
                  
                  return (
                    <Link
                      key={category.id}
                      to={`/werkjes/borduren/${category.slug}`}
                      className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md hover:shadow-xl transition-shadow"
                    >
                      <div className="aspect-[940/788] bg-gray-100 overflow-hidden">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Geen afbeelding
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Bekijk alle items in deze categorie
                        </p>
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>
        </section>

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
                    const itemSlug = slugify(item.name)
                    const category = categories.find(c => c.id === item.category_id)
                    const href = category?.headcategory_id 
                      ? `/werkjes/borduren/${headcategories.find(hc => hc.id === category.headcategory_id)?.slug}/${category.slug}/${itemSlug}`
                      : category ? `/werkjes/borduren/${category.slug}/${itemSlug}` : '#'
                    
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex justify-center items-center space-x-6">
            {/* Instagram Icon */}
            <a
              href="https://www.instagram.com/nikkieshandwerkparadijs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-300"
              aria-label="Instagram"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* Facebook Icon */}
            <a
              href="https://www.facebook.com/nikkieshandwerkparadijs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-300"
              aria-label="Facebook"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>

          <div className="mt-4 text-center text-gray-400 text-sm">
            © 2024 Nikkie's Handwerk Paradijs. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Borduren;
