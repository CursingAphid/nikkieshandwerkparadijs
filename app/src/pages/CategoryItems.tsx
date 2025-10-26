import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
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

type Item = {
  id: number
  name: string
  price: number | null
  images: string[] | null
  created_at: string
  order: number
}

type Category = {
  id: number
  name: string
  slug: string
}

// Sortable Item Component
function SortableItem({ item }: { item: Item }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

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
      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-grab active:cursor-grabbing"
    >
      <div className="font-semibold text-lg mb-2">{item.name}</div>
      {item.price !== null ? (
        <div className="text-lg font-medium text-green-600 mb-2">
          €{item.price.toFixed(2)}
        </div>
      ) : (
        <div className="text-lg font-medium text-gray-600 mb-2">
          Prijs in overleg
        </div>
      )}
      {Array.isArray(item.images) && item.images.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {item.images.slice(0, 3).map((url) => (
            <img 
              key={url} 
              src={url} 
              alt="item" 
              className="w-16 h-16 object-cover rounded"
            />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Link className="btn" to={`/admin/items/${item.id}/edit`}>
          Edit
        </Link>
      </div>
    </div>
  )
}

function CategoryItems() {
  const { id } = useParams<{ id: string }>()
  const [items, setItems] = useState<Item[]>([])
  const [category, setCategory] = useState<Category | null>(null)
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
        // Load items in this category
        const itemsRes = await apiFetch(`/categories/${id}/items`)
        const itemsData = await itemsRes.json()
        if (!itemsRes.ok) throw new Error(itemsData?.error || 'Failed to load items')
        
        // Load category info
        const catsRes = await apiFetch('/categories')
        const catsData = await catsRes.json()
        if (!catsRes.ok) throw new Error(catsData?.error || 'Failed to load categories')
        
        const currentCategory = catsData.find((c: Category) => c.id === Number(id))
        
        if (!cancelled) {
          setItems(itemsData)
          setCategory(currentCategory)
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
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      // Update order values in the database
      setIsUpdating(true)
      try {
        const updatedItems = newItems.map((item, index) => ({
          id: item.id,
          order: index
        }))
        
        const res = await apiFetch('/items/orders', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: updatedItems }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          
          if (res.status === 401) {
            throw new Error('You need to be logged in as admin to reorder items. Please log in first.')
          }
          throw new Error(errorData?.error || 'Failed to update item order')
        }
      } catch (e: any) {
        // Revert the local state on error
        setItems(items)
        alert(`Failed to save new order: ${e.message}`)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  return (
    <div className="container">
      <h1 className="title">
        {category ? `Items in ${category.name}` : 'Category Items'}
      </h1>
      
      <div className="mb-4">
        <Link className="btn" to="/admin">← Back to Dashboard</Link>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      
      {!loading && !error && (
        <div className="card">
          {items.length === 0 ? (
            <p className="text-gray-500">No items in this category yet.</p>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Drag and drop items to reorder them. {isUpdating && 'Saving...'}
              </p>
            </div>
          )}
          
          {items.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <SortableItem key={item.id} item={item} />
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

export default CategoryItems
