import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  type: string | null
  headimageurl: string | null
  created_at: string
  order: number
}

type HeadCategory = {
  id: number
  name: string
  slug: string
}

// Sortable Category Component
function SortableCategory({ category }: { category: Category }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

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
        type="category"
        id={category.id}
        name={category.name}
        slug={category.slug}
        description={category.description}
        craftType={category.type}
        headimageurl={category.headimageurl}
        viewHref={`/admin/categories/${category.id}/items`}
        useIcons
      />
    </div>
  )
}

function HeadCategoryCategories() {
  const { id } = useParams<{ id: string }>()
  const [categories, setCategories] = useState<Category[]>([])
  const [headcategory, setHeadcategory] = useState<HeadCategory | null>(null)
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
        // Load categories in this headcategory
        const categoriesRes = await apiFetch(`/headcategories/${id}/categories`)
        const categoriesData = await categoriesRes.json()
        if (!categoriesRes.ok) throw new Error(categoriesData?.error || 'Failed to load categories')
        
        // Load headcategory info
        const headcategoryRes = await apiFetch(`/headcategories/${id}`)
        const headcategoryData = await headcategoryRes.json()
        if (!headcategoryRes.ok) throw new Error(headcategoryData?.error || 'Failed to load headcategory')
        
        if (!cancelled) {
          setCategories(categoriesData)
          setHeadcategory(headcategoryData)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex((category) => category.id === active.id)
      const newIndex = categories.findIndex((category) => category.id === over?.id)

      const newCategories = arrayMove(categories, oldIndex, newIndex)
      setCategories(newCategories)

      // Update order values in the database
      setIsUpdating(true)
      try {
        const updatedCategories = newCategories.map((category, index) => ({
          id: category.id,
          order: index
        }))
        
        const res = await apiFetch('/categories/orders', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categories: updatedCategories }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          
          if (res.status === 401) {
            throw new Error('You need to be logged in as admin to reorder categories. Please log in first.')
          }
          throw new Error(errorData?.error || 'Failed to update category order')
        }
      } catch (e: any) {
        // Revert the local state on error
        setCategories(categories)
        alert(`Failed to save new order: ${e.message}`)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  return (
    <div className="container">
      <h1 className="title">
        {headcategory ? `Categories in ${headcategory.name}` : 'Head Category Categories'}
      </h1>

      <div className="mb-4">
        <Link className="btn" to="/admin">← Back to Dashboard</Link>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="card">
          {categories.length === 0 ? (
            <p className="text-gray-500">No categories in this head category yet.</p>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Drag and drop categories to reorder them. {isUpdating && 'Saving...'}
              </p>
            </div>
          )}

          {categories.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map(category => category.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map((category) => (
                    <SortableCategory key={category.id} category={category} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  )
}

export default HeadCategoryCategories
