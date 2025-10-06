import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import Logo from '../assets/home/logo.png'

type Item = {
  id: number
  name: string
  images: string[] | null
  created_at: string
}

function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemIdToCategory, setItemIdToCategory] = useState<Record<number, { slug: string; type?: string }>>({})
  const [favorites, setFavorites] = useState<Item[]>([])

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch('/items')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load items')
        const all = (json as Item[])
        const favs = all.filter((i: any) => i.is_favorite).slice(0, 3)
        const list = all.slice(0, 10)
        if (!cancelled) setItems(list)
        if (!cancelled) setFavorites(favs)
        // Load first category slug for each item (best-effort)
        const entries = await Promise.all(
          list.map(async (it) => {
            try {
              const r = await apiFetch(`/items/${it.id}/categories`)
              const cats = await r.json()
              const slug = Array.isArray(cats) && cats[0]?.slug ? String(cats[0].slug) : ''
              const type = Array.isArray(cats) && cats[0]?.type ? String(cats[0].type) : undefined
              return [it.id, { slug, type }] as const
            } catch {
              return [it.id, { slug: '' }] as const
            }
          })
        )
        if (!cancelled) {
          const map: Record<number, { slug: string; type?: string }> = {}
          for (const [id, meta] of entries) map[id] = meta
          setItemIdToCategory(map)
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

  return (
    <div>
      {/* Full-bleed title section */}
      <section className="w-full bg-green-100">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 flex items-center justify-center">
          <img src={Logo} alt="Nikkie’s Handwerk Paradijs" className="w-48 md:w-64 lg:w-72 h-auto" />
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pt-0 pb-8">
        {/* removed separate full-bleed title bar */}

        {favorites.length > 0 && (
          <div className="mb-12">
            <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
              <section className="stage relative">
                <div className="stage-top"></div>
                <div className="stars"></div>
                <div className="stars2"></div>
                <div className="stars3"></div>
                <div className="mx-auto max-w-6xl px-4 pt-6 pb-0">
                  <h2 className="text-white text-2xl font-semibold text-center mb-4">Favorieten</h2>
                  {(() => {
              const a = favorites.slice(0, 3)
              const podium = a.length === 1
                ? [{ item: a[0], rank: 1 }]
                : a.length === 2
                  ? [{ item: a[1], rank: 2 }, { item: a[0], rank: 1 }]
                  : [{ item: a[1], rank: 2 }, { item: a[0], rank: 1 }, { item: a[2], rank: 3 }]
              const height = (r: number) => r === 1 ? 'h-36 md:h-48' : r === 2 ? 'h-28 md:h-40' : 'h-28 md:h-36'
              return (
                <div className="flex items-end justify-center gap-6 sm:gap-20">
                  {podium.map(({ item, rank }) => {
                    const first = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null
                    const meta = itemIdToCategory[item.id] || { slug: '' }
                    const catSlug = meta.slug
                    const itemSlug = slugify(item.name)
                    const href = catSlug ? `/werkjes/${catSlug}/${itemSlug}` : undefined
                    const badgeBg = rank === 1 ? 'bg-[#d4af37]' : rank === 2 ? 'bg-[#c0c0c0]' : 'bg-[#cd7f32]'
                    return (
                      <div key={`podium-${item.id}-${rank}`} className="flex w-40 sm:w-52 md:w-64 flex-col items-center">
                        <div className="relative z-10 w-full -mb-12">
                          {href ? (
                            <Link to={href} className="block overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-lg">
                              <div className="aspect-square bg-gray-100">
                                {first ? (
                                  <img src={first} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">Geen afbeelding</div>
                                )}
                              </div>
                            </Link>
                          ) : (
                            <div className="overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-lg">
                              <div className="aspect-square bg-gray-100">
                                {first ? (
                                  <img src={first} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">Geen afbeelding</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className={`relative w-full ${height(rank)} rounded-t-md flex items-end justify-center ring-1 ring-gray-200 ` +
                            (rank === 1
                              ? 'gold-texture'
                              : rank === 2
                              ? 'silver-texture'
                              : 'bronze-texture')}
                        >
                          <div className="mb-3">
                            <span className={`inline-flex items-center justify-center rounded-full border-2 border-white shadow-md ${badgeBg} w-12 h-12 md:w-16 md:h-16 text-2xl md:text-3xl font-extrabold text-white`}>
                              {rank}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                    </div>
                  )
                })()}
                </div>
                <div className="stage-floor"></div>
              </section>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-semibold mb-6 text-center">Recent toegevoegd</h1>
        {loading && <p>Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="carousel">
            <div className="carousel-track">
              {[...items, ...items].map((it, idx) => {
                const first = Array.isArray(it.images) && it.images.length > 0 ? it.images[0] : null
                const catSlug = itemIdToCategory[it.id]?.slug
                const itemSlug = slugify(it.name)
                const href = catSlug ? `/werkjes/${catSlug}/${itemSlug}` : undefined
                return (
                  <div key={`${it.id}-${idx}`} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md w-56 md:w-64 lg:w-72 flex-shrink-0">
                    {href ? (
                      <Link to={href} className="block">
                        <div className="aspect-square bg-gray-100 overflow-hidden">
                          {first ? (
                            <img src={first} alt={it.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        {first ? (
                          <img src={first} alt={it.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home


