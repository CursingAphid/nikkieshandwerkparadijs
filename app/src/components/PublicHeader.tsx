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
  headcategory_id?: number | null
}

type HeadCategory = {
  id: number
  name: string
  slug: string
  type: string | null
}

type CategoryWithSubcategories = {
  id: number
  name: string
  slug: string
  type: string | null
  isHeadcategory: boolean
  subcategories?: Category[]
}

function PublicHeader() {
  const loc = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [headcategories, setHeadcategories] = useState<HeadCategory[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null)
  const [expandedHeadcategories, setExpandedHeadcategories] = useState<Set<number>>(new Set())
  const [headcategorySubcategories, setHeadcategorySubcategories] = useState<{[key: number]: Category[]}>({})
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

  // Load categories and headcategories on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesRes, headcategoriesRes] = await Promise.all([
          apiFetch('/categories'),
          apiFetch('/headcategories')
        ])
        
        const [categoriesData, headcategoriesData] = await Promise.all([
          categoriesRes.json(),
          headcategoriesRes.json()
        ])
        
        if (categoriesRes.ok) setCategories(categoriesData)
        if (headcategoriesRes.ok) {
          setHeadcategories(headcategoriesData)
          
          // Preload subcategories for all headcategories
          const subcategoryPromises = headcategoriesData.map(async (headcat: HeadCategory) => {
            try {
              const res = await apiFetch(`/headcategories/${headcat.id}/categories`)
              const data = await res.json()
              if (res.ok) {
                return { headcategoryId: headcat.id, subcategories: data }
              }
            } catch (e) {
              console.error(`Failed to load subcategories for headcategory ${headcat.id}`, e)
            }
            return { headcategoryId: headcat.id, subcategories: [] }
          })
          
          const subcategoryResults = await Promise.all(subcategoryPromises)
          const subcategoryMap: {[key: number]: Category[]} = {}
          subcategoryResults.forEach(result => {
            subcategoryMap[result.headcategoryId] = result.subcategories
          })
          
          setHeadcategorySubcategories(subcategoryMap)
        }
      } catch (e) {
        console.error('Failed to load data', e)
      }
    }
    loadData()
  }, [])

  // Toggle headcategory expansion
  const toggleHeadcategory = (headcategoryId: number) => {
    setExpandedHeadcategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(headcategoryId)) {
        newSet.delete(headcategoryId)
      } else {
        newSet.add(headcategoryId)
      }
      return newSet
    })
  }

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

  // Add/remove body class for mobile search modal
  useEffect(() => {
    if (mobileSearchOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [mobileSearchOpen])

  const getCategoryData = (categoryId: number) => {
    const cat = categories.find(c => c.id === categoryId)
    return {
      slug: cat?.slug || '',
      type: cat?.type || 'haken'
    }
  }

  // Get dropdown data for a specific type (haken or borduren)
  const getDropdownData = (type: 'haken' | 'borduren') => {
    const headcats = headcategories.filter(hc => hc.type === type)
    const standaloneCats = categories.filter(c => 
      c.type === type && 
      (c.headcategory_id === null || c.headcategory_id === undefined)
    )
    
    // Create unified list with headcategories and standalone categories
    const unifiedList: CategoryWithSubcategories[] = []
    
    // Add headcategories first
    headcats.forEach(headcat => {
      unifiedList.push({
        id: headcat.id,
        name: headcat.name,
        slug: headcat.slug,
        type: headcat.type,
        isHeadcategory: true,
        subcategories: headcategorySubcategories[headcat.id] || []
      })
    })
    
    // Add standalone categories
    standaloneCats.forEach(cat => {
      unifiedList.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        type: cat.type,
        isHeadcategory: false
      })
    })
    
    return unifiedList
  }

  // Navigation link with dropdown support
  const navLink = (to: string, label: string, hasDropdown: boolean = false) => {
    const dropdownData = hasDropdown ? getDropdownData(label.toLowerCase() as 'haken' | 'borduren') : null
    
    return (
      <div 
        className="relative flex items-center"
        onMouseEnter={() => hasDropdown && setHoveredNavItem(label)}
        onMouseLeave={() => hasDropdown && setHoveredNavItem(null)}
      >
        <Link
          to={to}
          className={`px-3 py-2 rounded-md text-sm font-medium ${is(to) ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          {label}
        </Link>
        
        {/* Dropdown Menu */}
        {hasDropdown && hoveredNavItem === label && dropdownData && (
          <div className="absolute top-full left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[70]">
            <div className="py-2">
              {dropdownData.map((item) => (
                <div key={item.id}>
                  {item.isHeadcategory ? (
                    <div>
                      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Link
                          to={`/werkjes/${label.toLowerCase()}/${item.slug}`}
                          className="flex-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleHeadcategory(item.id)
                          }}
                        >
                          <span 
                            className="transition-transform duration-200"
                            style={{ 
                              transform: expandedHeadcategories.has(item.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                              display: 'inline-block'
                            }}
                          >
                            ▶
                          </span>
                        </button>
                      </div>
                      
                      {/* Subcategories - shown when expanded */}
                      {expandedHeadcategories.has(item.id) && item.subcategories && item.subcategories.length > 0 && (
                        <div className="ml-4 border-l border-gray-200 pl-2">
                          {item.subcategories.map((subcat) => (
                            <Link
                              key={subcat.id}
                              to={`/werkjes/${label.toLowerCase()}/${item.slug}/${subcat.slug}`}
                              className="block px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                            >
                              {subcat.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={`/werkjes/${label.toLowerCase()}/${item.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Show message if no items */}
              {dropdownData.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Geen {label.toLowerCase()} categorieën beschikbaar
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="w-full px-5 py-[6px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="Home">
            <img src={HeaderLogo} alt="Nikkie's Handwerk Paradijs" className="h-12 w-auto" />
          </Link>
          
          {/* Right side elements */}
          <div className="flex items-center gap-3">
            {/* Search Bar - Hidden on mobile */}
            <div ref={searchRef} className="relative w-80 hidden lg:block">
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-[70]">
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

            {/* Mobile Search Button */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              aria-label="Search"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-2">
              {link('/', 'Home')}
              {navLink('/werkjes/haken', 'Haken', true)}
              {navLink('/werkjes/borduren', 'Borduren', true)}
              {link('/over', 'Over')}
              {link('/build', 'Stel je eigen set samen')}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMobileMenuOpen(!mobileMenuOpen)
              }}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 touch-manipulation"
              aria-label="Toggle menu"
              type="button"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {/* Mobile Navigation Links */}
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${is('/') ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Home
              </Link>
              
              {/* Haken with submenu */}
              <div>
                <Link
                  to="/werkjes/haken"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${is('/werkjes/haken') ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Haken
                </Link>
                {(() => {
                  const dropdownData = getDropdownData('haken')
                  return (
                    <div className="ml-4 space-y-1">
                      {dropdownData.map((item) => (
                        <div key={item.id}>
                          {item.isHeadcategory ? (
                            <div>
                              <div className="px-3 py-1 text-xs text-gray-600 font-medium flex items-center justify-between">
                                <Link
                                  to={`/werkjes/haken/${item.slug}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="flex-1"
                                >
                                  {item.name}
                                </Link>
                                <button
                                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 touch-manipulation"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    toggleHeadcategory(item.id)
                                  }}
                                  type="button"
                                  aria-label={`Toggle ${item.name} submenu`}
                                >
                                  <span 
                                    className="transition-transform duration-200"
                                    style={{ 
                                      transform: expandedHeadcategories.has(item.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                                      display: 'inline-block'
                                    }}
                                  >
                                    ▶
                                  </span>
                                </button>
                              </div>
                              {expandedHeadcategories.has(item.id) && item.subcategories && item.subcategories.length > 0 && (
                                <div className="ml-4 space-y-1">
                                  {item.subcategories.map((subcat) => (
                                    <Link
                                      key={subcat.id}
                                      to={`/werkjes/haken/${item.slug}/${subcat.slug}`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block px-3 py-1 text-xs text-gray-500 hover:text-gray-800"
                                    >
                                      • {subcat.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Link
                              to={`/werkjes/haken/${item.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                            >
                              • {item.name}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
              
              {/* Borduren with submenu */}
              <div>
                <Link
                  to="/werkjes/borduren"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${is('/werkjes/borduren') ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Borduren
                </Link>
                {(() => {
                  const dropdownData = getDropdownData('borduren')
                  return (
                    <div className="ml-4 space-y-1">
                      {dropdownData.map((item) => (
                        <div key={item.id}>
                          {item.isHeadcategory ? (
                            <div>
                              <div className="px-3 py-1 text-xs text-gray-600 font-medium flex items-center justify-between">
                                <Link
                                  to={`/werkjes/borduren/${item.slug}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="flex-1"
                                >
                                  {item.name}
                                </Link>
                                <button
                                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 touch-manipulation"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    toggleHeadcategory(item.id)
                                  }}
                                  type="button"
                                  aria-label={`Toggle ${item.name} submenu`}
                                >
                                  <span 
                                    className="transition-transform duration-200"
                                    style={{ 
                                      transform: expandedHeadcategories.has(item.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                                      display: 'inline-block'
                                    }}
                                  >
                                    ▶
                                  </span>
                                </button>
                              </div>
                              {expandedHeadcategories.has(item.id) && item.subcategories && item.subcategories.length > 0 && (
                                <div className="ml-4 space-y-1">
                                  {item.subcategories.map((subcat) => (
                                    <Link
                                      key={subcat.id}
                                      to={`/werkjes/borduren/${item.slug}/${subcat.slug}`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block px-3 py-1 text-xs text-gray-500 hover:text-gray-800"
                                    >
                                      • {subcat.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Link
                              to={`/werkjes/borduren/${item.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                            >
                              • {item.name}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
              
              <Link
                to="/over"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${is('/over') ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Over
              </Link>
              <Link
                to="/build"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${is('/build') ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Stel je eigen set samen
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Search Modal - Outside header container */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center z-[80] lg:hidden">
          <div className="bg-white w-full max-w-md mx-4 mt-20 rounded-lg shadow-xl">
            <div className="p-4">
              {/* Search Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Zoeken</h3>
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  placeholder="Zoeken..."
                  className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  autoFocus
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

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Zoeken...
                  </div>
                ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    Geen resultaten gevonden
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
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
                            setMobileSearchOpen(false)
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors rounded-lg"
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
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PublicHeader



