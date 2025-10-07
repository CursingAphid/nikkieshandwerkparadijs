import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import HeaderLogo from '../assets/home/header-logo.png'
import { apiFetch } from '../lib/api'

type Item = {
  id: number
  name: string
  price: number | null
  images: string[] | null
  category_id: number
}

type Category = {
  id: number
  name: string
  slug: string
  type: string | null
}

function PublicHeader() {
  const loc = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const is = (p: string) => loc.pathname === p
  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium ${is(to) ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      {label}
    </Link>
  )

  // Helper function to create slug from name
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiFetch('/categories')
        const data = await res.json()
        if (res.ok) setCategories(data)
      } catch (e) {
        console.error('Failed to load categories', e)
      }
    }
    loadCategories()
  }, [])

  // Search function
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const searchItems = async () => {
      setLoading(true)
      try {
        // Load all items from all categories
        const allItems: Item[] = []
        for (const cat of categories) {
          const res = await apiFetch(`/categories/${cat.id}/items`)
          const items = await res.json()
          if (res.ok) {
            // Ensure each item has the correct category_id
            const itemsWithCategory = items.map((item: any) => ({
              ...item,
              category_id: cat.id
            }))
            allItems.push(...itemsWithCategory)
          }
        }

        // Filter items based on search query
        const query = searchQuery.toLowerCase()
        const filtered = allItems.filter(item => 
          item.name.toLowerCase().includes(query)
        )

        setSearchResults(filtered)
        setShowResults(true)
      } catch (e) {
        console.error('Search failed', e)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchItems, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, categories])

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCategoryData = (categoryId: number) => {
    const cat = categories.find(c => c.id === categoryId)
    return {
      slug: cat?.slug || '',
      type: cat?.type || 'haken'
    }
  }

  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-[6px] flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2" aria-label="Home">
          <img src={HeaderLogo} alt="Nikkie's Handwerk Paradijs" className="h-12 w-auto" />
        </Link>
        
        {/* Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md mx-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              placeholder="Zoeken..."
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Zoeken...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Geen resultaten gevonden
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.map((item) => {
                    const categoryData = getCategoryData(item.category_id)
                    const itemSlug = slugify(item.name)
                    const href = categoryData.slug && categoryData.type ? `/werkjes/${categoryData.type}/${categoryData.slug}/${itemSlug}` : '#'
                    const firstImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null

                    return (
                      <Link
                        key={item.id}
                        to={href}
                        onClick={() => {
                          setShowResults(false)
                          setSearchQuery('')
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {firstImage ? (
                            <img src={firstImage} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              Geen foto
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          {item.price != null && (
                            <p className="text-sm text-green-600">€{item.price.toFixed(2)}</p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="ml-auto flex gap-2">
          {link('/', 'Home')}
          {link('/werkjes/haken', 'Haken')}
          {link('/werkjes/borduren', 'Borduren')}
          {link('/over', 'Over')}
          {link('/build', 'Stel je eigen set samen')}
        </nav>
      </div>
    </div>
  )
}

export default PublicHeader


