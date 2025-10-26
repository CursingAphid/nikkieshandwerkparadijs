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
  headcategory_id?: number | null
}

type HeadCategory = {
  id: number
  name: string
  slug: string
  type: string | null
}

function ItemDetail() {
  const { type, param1, param2, param3 } = useParams<{ type: string; param1: string; param2?: string; param3?: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [headcategory, setHeadcategory] = useState<HeadCategory | null>(null)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Helper function to create slug from name
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Function to copy link to clipboard
  const copyLink = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Swipe handling functions
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = images.findIndex(img => img === selectedImage)
      
      if (isLeftSwipe) {
        // Swipe left - go to next image (loop to first if at end)
        if (currentIndex < images.length - 1) {
          setSelectedImage(images[currentIndex + 1])
        } else {
          setSelectedImage(images[0])
        }
      } else if (isRightSwipe) {
        // Swipe right - go to previous image (loop to last if at beginning)
        if (currentIndex > 0) {
          setSelectedImage(images[currentIndex - 1])
        } else {
          setSelectedImage(images[images.length - 1])
        }
      }
    }
  }

  // Navigation functions
  const goToNextImage = () => {
    const currentIndex = images.findIndex(img => img === selectedImage)
    if (currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1])
    } else {
      // Loop to first image
      setSelectedImage(images[0])
    }
  }

  const goToPreviousImage = () => {
    const currentIndex = images.findIndex(img => img === selectedImage)
    if (currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1])
    } else {
      // Loop to last image
      setSelectedImage(images[images.length - 1])
    }
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
        
        let foundCategory: Category | null = null
        let foundHeadcategory: HeadCategory | null = null
        
        // Determine URL structure based on parameters
        const isParam1Headcategory = headcatsData.some((hc: HeadCategory) => hc.slug === param1 && hc.type === type)
        
        if (param3) {
          // 4 parameters: /werkjes/type/headcategory/category/item
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
        } else if (param2) {
          // 3 parameters: /werkjes/type/category/item (standalone category)
          foundCategory = catsData.find((c: Category) => c.slug === param1)
          
          // Find the headcategory if this category belongs to one
          if (foundCategory && foundCategory.headcategory_id) {
            foundHeadcategory = headcatsData.find((hc: HeadCategory) => hc.id === foundCategory!.headcategory_id && hc.type === type)
          }
        }
        
        if (!foundCategory) {
          throw new Error('Category not found')
        }

        // Load items in this category
        const itemsRes = await apiFetch(`/categories/${foundCategory.id}/items`)
        const itemsData = await itemsRes.json()
        if (!itemsRes.ok) throw new Error(itemsData?.error || 'Failed to load items')

            // Find the item by slug
            const itemSlug = param3 || param2
            const foundItem = itemsData.find((i: Item) => slugify(i.name) === itemSlug)
        if (!foundItem) {
          throw new Error('Item not found')
        }

        if (!cancelled) {
          setCategory(foundCategory)
          setHeadcategory(foundHeadcategory)
          setItem(foundItem)
          setAllItems(itemsData)
          // Set the first image as selected by default
          if (foundItem.images && foundItem.images.length > 0) {
            setSelectedImage(foundItem.images[0])
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load item')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [param1, param2, param3])

  // Scroll to top when component mounts (when navigating to a new item)
  useEffect(() => {
    // Immediate scroll
    window.scrollTo({ top: 0, behavior: 'auto' })
    // Also scroll after delays to ensure it works
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }, 300)
  }, [item?.id]) // Trigger when the item ID changes

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p>Loading…</p>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-600">{error || 'Item not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back to Home
        </button>
      </div>
    )
  }

  const images = item.images || []
  const mainImage = selectedImage || (images.length > 0 ? images[0] : null)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb and Share Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
              {headcategory && type && (
                <>
                  <Link 
                    to={`/werkjes/${type}/${headcategory.slug}`}
                    className="hover:text-gray-900 hover:underline"
                  >
                    {headcategory.name}
                  </Link>
                  <span className="mx-2">/</span>
                </>
              )}
              {category && type && (
                <>
                  <Link 
                    to={headcategory ? `/werkjes/${type}/${headcategory.slug}/${category.slug}` : `/werkjes/${type}/${category.slug}`}
                    className="hover:text-gray-900 hover:underline"
                  >
                    {category.name}
                  </Link>
                  <span className="mx-2">/</span>
                </>
              )}
          <span className="text-gray-900">{item.name}</span>
        </div>
        
        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          <span className="font-medium">Delen</span>
        </button>
      </div>

      {/* Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left side - Images */}
        <div>
          {/* Main Image */}
          <div 
            className="w-full aspect-[940/788] bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-lg relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {mainImage ? (
              <img
                src={mainImage}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Geen afbeelding
              </div>
            )}
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                {/* Previous Arrow */}
                <button
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                  aria-label="Previous image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Next Arrow */}
                <button
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                  aria-label="Next image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Swipe indicators for mobile */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      images[index] === selectedImage ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 bg-gray-100 rounded-lg overflow-hidden transition-all flex-shrink-0 ${
                    selectedImage === img
                      ? 'ring-4 ring-blue-500 scale-95'
                      : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${item.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side - Details */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{item.name}</h1>
          
          {item.price != null ? (
            <div className="text-2xl md:text-3xl font-semibold text-green-600 mb-6">
              €{item.price.toFixed(2)}
            </div>
          ) : (
            <div className="text-2xl md:text-3xl font-semibold text-gray-600 mb-6">
              Prijs in overleg
            </div>
          )}

          {/* WhatsApp Bestellen Button */}
          <div className="mb-6">
            <a
              href={`https://wa.me/31653131922?text=${encodeURIComponent(`Hallo, ik heb interesse in ${window.location.href}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300 font-semibold"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span>Bestellen</span>
            </a>
          </div>

          {item.description && (
            <div className="prose max-w-none mb-6">
              <h2 className="text-xl font-semibold mb-2">Beschrijving</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* More from this collection */}
      {allItems.length > 1 && (
        <div id="more-from-collection" className="mt-16 border-t pt-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Meer uit deze collectie
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {allItems
              .filter((it) => it.id !== item.id)
              .map((it) => {
                const first = Array.isArray(it.images) && it.images.length > 0 ? it.images[0] : null
                    const itemHref = type && category ? (headcategory ? `/werkjes/${type}/${headcategory.slug}/${category.slug}/${slugify(it.name)}` : `/werkjes/${type}/${category.slug}/${slugify(it.name)}`) : '#'
                
                return (
                   <Link
                     key={it.id}
                     to={itemHref}
                     onClick={(e) => {
                       // Prevent default navigation temporarily
                       e.preventDefault()
                       
                       // Scroll to top immediately
                       window.scrollTo({ top: 0, behavior: 'auto' })
                       document.documentElement.scrollTop = 0
                       document.body.scrollTop = 0
                       
                       // Navigate after a tiny delay to ensure scroll happens first
                       setTimeout(() => {
                         window.location.href = itemHref
                       }, 10)
                     }}
                     className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md hover:shadow-xl transition-shadow"
                   >
                    <div className="aspect-[940/788] bg-gray-100 overflow-hidden">
                      {first ? (
                        <img
                          src={first}
                          alt={it.name}
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
                        {it.name}
                      </h3>
                      {it.price != null ? (
                        <div className="text-green-600 font-medium">
                          €{it.price.toFixed(2)}
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
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <h2 className="text-2xl font-bold mb-4">Deel dit artikel met anderen</h2>
            <p className="text-gray-600 mb-6">
              Kopieer deze link. Hierna kan je hem plakken en delen.
            </p>

            {/* Link Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link
                </label>
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                />
              </div>

              <button
                onClick={copyLink}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {copySuccess ? 'Gekopieerd!' : 'Kopieer link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ItemDetail

