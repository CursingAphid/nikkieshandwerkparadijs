import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import ActivityCard from '../components/ActivityCard'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent } from '@dnd-kit/core'

type HeadCategory = {
  id: number
  name: string
  slug: string
  description: string | null
  type: string | null
  headimageurl: string | null
  created_at: string;
  order: number;
}

// Sortable HeadCategory Component
function SortableHeadCategory({ headcategory, images }: { headcategory: HeadCategory; images: string[] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: headcategory.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <ActivityCard
        type="headcategory"
        id={headcategory.id}
        name={headcategory.name}
        slug={headcategory.slug}
        description={headcategory.description}
        images={images.length > 0 ? images : (headcategory.headimageurl ? [headcategory.headimageurl] : undefined)}
        viewHref={`/admin/headcategories/${headcategory.id}/categories`}
        useIcons
      />
    </div>
  )
}

function AdminHeadCategories() {
  const [headcategories, setHeadcategories] = useState<HeadCategory[]>([])
  const [headcategoryImages, setHeadcategoryImages] = useState<{[key: number]: string[]}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = headcategories.findIndex((headcategory) => headcategory.id === active.id)
      const newIndex = headcategories.findIndex((headcategory) => headcategory.id === over?.id)

      const newHeadcategories = arrayMove(headcategories, oldIndex, newIndex)
      setHeadcategories(newHeadcategories)

      // Update order values in the database
      setIsUpdating(true)
      try {
        const updatedHeadcategories = newHeadcategories.map((headcategory, index) => ({
          id: headcategory.id,
          order: index
        }))
        
        const res = await apiFetch('/headcategories/orders', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ headcategories: updatedHeadcategories }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          
          if (res.status === 401) {
            throw new Error('You need to be logged in as admin to reorder headcategories. Please log in first.')
          }
          throw new Error(errorData?.error || 'Failed to update headcategory order')
        }
      } catch (e: any) {
        // Revert the local state on error
        setHeadcategories(headcategories)
        alert(`Failed to save new order: ${e.message}`)
      } finally {
        setIsUpdating(false)
      }
    }
  }

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
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Drag and drop head categories to reorder them. {isUpdating && 'Saving...'}
              </p>
            </div>
          )}

          {headcategories.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={headcategories.map(headcategory => headcategory.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {headcategories.map((headcategory) => {
                    const images = headcategoryImages[headcategory.id] || []
                    return (
                      <SortableHeadCategory 
                        key={headcategory.id} 
                        headcategory={headcategory} 
                        images={images}
                      />
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminHeadCategories
