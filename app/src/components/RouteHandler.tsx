import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import Category from '../pages/Category'
import ItemDetail from '../pages/ItemDetail'

type HeadCategory = {
  id: number
  name: string
  slug: string
  type: string | null
}

function RouteHandler() {
  const { type, param1, param2, param3 } = useParams<{ 
    type: string; 
    param1: string; 
    param2?: string; 
    param3?: string; 
  }>()
  const [headcategories, setHeadcategories] = useState<HeadCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHeadcategories() {
      try {
        const res = await apiFetch('/headcategories')
        const data = await res.json()
        if (res.ok) {
          setHeadcategories(data)
        }
      } catch (e) {
        console.error('Failed to load headcategories:', e)
      } finally {
        setLoading(false)
      }
    }
    loadHeadcategories()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  // Determine the URL structure based on parameters and headcategory existence
  const isParam1Headcategory = headcategories.some(hc => hc.slug === param1 && hc.type === type)
  
  console.log(`RouteHandler: /werkjes/${type}/${param1}${param2 ? `/${param2}` : ''}${param3 ? `/${param3}` : ''}`)
  console.log(`Is "${param1}" a headcategory for type "${type}"?`, isParam1Headcategory)
  
  if (param3) {
    // 4 parameters: /werkjes/type/param1/param2/param3
    if (isParam1Headcategory) {
      // /werkjes/type/headcategory/category/item
      return <ItemDetail />
    } else {
      // This shouldn't happen with 4 parameters
      return <div>Invalid URL structure</div>
    }
  } else if (param2) {
    // 3 parameters: /werkjes/type/param1/param2
    if (isParam1Headcategory) {
      // /werkjes/type/headcategory/category
      return <Category />
    } else {
      // /werkjes/type/category/item
      return <ItemDetail />
    }
  } else {
    // 2 parameters: /werkjes/type/param1
    if (isParam1Headcategory) {
      // /werkjes/type/headcategory
      return <Category />
    } else {
      // /werkjes/type/category
      return <Category />
    }
  }
}

export default RouteHandler
