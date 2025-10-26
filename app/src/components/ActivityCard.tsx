import { Link } from 'react-router-dom'

type ActivityCardProps = {
  type: 'item' | 'category' | 'headcategory'
  id: number
  name: string
  slug?: string
  description?: string | null
  craftType?: string | null
  price?: number | null
  images?: string[] | null
  headimageurl?: string | null
  showCraftType?: boolean
  viewHref?: string
  useIcons?: boolean
}

function ActivityCard({ 
  type, 
  id, 
  name, 
  slug, 
  description, 
  craftType, 
  price, 
  images, 
  headimageurl,
  showCraftType = true,
  viewHref,
  useIcons = false
}: ActivityCardProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {type === 'item' ? (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📦 Item</span>
            ) : type === 'headcategory' ? (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">🏷️ Head Category</span>
            ) : (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {showCraftType && craftType ? (
                  `${craftType === 'crochet' ? '🧶' : '🪡'} ${craftType}`
                ) : (
                  'Category'
                )}
              </span>
            )}
          </div>
          <div className="font-semibold text-lg mb-2">{name}</div>
          
          {(type === 'category' || type === 'headcategory') && slug && (
            <div className="text-sm text-gray-500 mb-2">{slug}</div>
          )}
          
          {type === 'item' && (
            <div className="text-lg font-medium mb-2">
              {price != null ? (
                <span className="text-green-600">€{price.toFixed(2)}</span>
              ) : (
                <span className="text-gray-600">Prijs in overleg</span>
              )}
            </div>
          )}
          
          {description && (
            <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
              {description.length > 100 
                ? `${description.substring(0, 100)}...` 
                : description
              }
            </div>
          )}
          
          {type === 'item' && Array.isArray(images) && images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.slice(0, 2).map((url) => (
                <img 
                  key={url} 
                  src={url} 
                  alt="item" 
                  className="w-16 h-16 object-cover rounded"
                />
              ))}
            </div>
          )}
          
          {type === 'headcategory' && Array.isArray(images) && images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.slice(0, 4).map((url) => (
                <img 
                  key={url} 
                  src={url} 
                  alt="headcategory" 
                  className="w-16 h-16 object-cover rounded"
                />
              ))}
            </div>
          )}
          
          {type === 'category' && headimageurl && (
            <div className="mb-2">
              <img 
                src={headimageurl} 
                alt="category" 
                className="w-16 h-16 object-cover rounded"
              />
            </div>
          )}
        </div>
        <div className="ml-4 flex items-center gap-2">
          {viewHref && (
            <Link className="btn" to={viewHref} title="Bekijken">
              {useIcons ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : 'View'}
            </Link>
          )}
          <Link className="btn" to={`/admin/${type === 'item' ? 'items' : type === 'headcategory' ? 'headcategories' : 'categories'}/${id}/edit`} title="Bewerken">
            {useIcons ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>
              </svg>
            ) : 'Edit'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ActivityCard
