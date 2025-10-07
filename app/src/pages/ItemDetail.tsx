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
}

function ItemDetail() {
  const { type, categorySlug, itemSlug } = useParams<{ type: string; categorySlug: string; itemSlug: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

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

        // Find the item by slug
        const foundItem = itemsData.find((i: Item) => slugify(i.name) === itemSlug)
        if (!foundItem) {
          throw new Error('Item not found')
        }

        if (!cancelled) {
          setCategory(foundCategory)
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
  }, [categorySlug, itemSlug])

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
          {category && type && (
            <>
              <Link 
                to={`/werkjes/${type}/${categorySlug}`}
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
          <div className="w-full aspect-[940/788] bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-lg">
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
          
          {item.price != null && (
            <div className="text-2xl md:text-3xl font-semibold text-green-600 mb-6">
              €{item.price.toFixed(2)}
            </div>
          )}

          {item.description && (
            <div className="prose max-w-none mb-6">
              <h2 className="text-xl font-semibold mb-2">Beschrijving</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          {/* Additional info or actions can go here */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Geïnteresseerd in dit product? Neem contact op voor meer informatie of om een bestelling te plaatsen.
            </p>
          </div>
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
                const itemHref = type ? `/werkjes/${type}/${categorySlug}/${slugify(it.name)}` : '#'
                
                return (
                  <Link
                    key={it.id}
                    to={itemHref}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
                      {it.price != null && (
                        <div className="text-green-600 font-medium">
                          €{it.price.toFixed(2)}
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

