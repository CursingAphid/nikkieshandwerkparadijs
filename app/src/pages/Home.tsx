import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import Logo from '../assets/home/logo.png'
import JungleBg from '../assets/home/jungle background.png'
import MonkeyBench from '../assets/home/money.png'
import Giraffe from '../assets/home/giraffe.png'
import HaakIconn from '../assets/home/haakicoon.png'
import BorduurIconn from '../assets/home/borduuricoon.png'

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
  // Load all images from assets/home/images_on_escalator for flexible walkers
  const escalatorModules = import.meta.glob('../assets/home/images_on_escalator/*.{png,jpg,jpeg,webp,gif,svg}', { eager: true, import: 'default' }) as Record<string, string>
  const escalatorUrls = Object.entries(escalatorModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, url]) => url)

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
    <div className="overflow-hidden">
      {/* Full-bleed title section */}
      <section className="w-full relative overflow-visible" style={{ backgroundImage: `url(${JungleBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="relative z-0 mx-auto max-w-6xl px-4 py-16 md:py-28 lg:py-32 flex flex-col items-center justify-center">
          <img src={Logo} alt="Nikkie's Handwerk Paradijs" className="-mt-4 md:-mt-6 lg:-mt-8 w-40 md:w-72 lg:w-80 h-auto" />
          <div className="mt-4 md:mt-6 text-center text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.85), 0 6px 16px rgba(0,0,0,0.35)' }}>
          </div>
        </div>
        <img 
          src={MonkeyBench} 
          alt="Aap op bankje"
          className="animal-drop absolute -top-2.5 right-[2%] md:right-[4%] lg:right-[6%] w-auto h-[100px] sm:h-[150px] md:h-[200px] lg:h-[250px] select-none pointer-events-none z-10"
        />
        <img 
          src={Giraffe} 
          alt="Giraffe"
          className="animal-drop-delayed absolute -top-2.5 left-[5%] md:left-[10%] lg:left-[12%] w-auto h-[120px] sm:h-[170px] md:h-[220px] lg:h-[270px] select-none pointer-events-none z-10"
        />
        {escalatorUrls.map((url, i) => (
          <img
            key={`marinebear-${i}`}
            src={url}
            alt="Escalator image"
            className="southpark-anim absolute bottom-0 left-[-30vw] w-auto h-[90px] sm:h-[120px] md:h-[160px] lg:h-[200px] select-none pointer-events-none z-10"
            style={{ animationDelay: `${i * 6}s`, animationDuration: '42s' }}
          />
        ))}
      </section>

      <main className="mx-auto max-w-6xl px-4 pt-0 pb-8">
        {/* Haken and Borduren sections */}
        <section className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-800 text-white">
          {/* Haken Section - Text left, Icon right - full width with gray-700 */}
          <div className="bg-gray-700">
            <div className="mx-auto max-w-6xl px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                <div className="text-left py-12">
                  <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">Haken</h2>
                  <p className="text-base md:text-lg leading-relaxed">
                    Het haken van knuffels of kraamcadeaus is een populair tijdsverdrijf als je graag creatief bezig wilt zijn. Het is een geweldige manier om iets persoonlijks en unieks te maken. Door verschillende kleuren en garens te gebruiken kun je alles aanpassen naar de gewenste smaak.
                  </p>
                  <p className="text-base md:text-lg leading-relaxed mt-4">
                    Een ander voordeel van haken is dat het een zeer ontspannende en meditatieve bezigheid is. Het vereist geduld en precisie, wat mij helpt om stress te verminderen en de geest te ontspannen.
                  </p>
                </div>
                <div className="flex justify-end items-stretch py-12">
                  <div className="w-full max-w-xs md:max-w-sm h-full rounded-lg overflow-hidden" style={{ backgroundColor: '#5C2D3D' }}>
                    <img src={HaakIconn} alt="Haken" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Borduren Section - Icon left, Text right - gray-800 background */}
          <div className="bg-gray-800">
            <div className="mx-auto max-w-6xl px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                <div className="flex justify-start items-stretch py-12 order-2 md:order-1">
                  <div className="w-full max-w-xs md:max-w-sm h-full rounded-lg overflow-hidden" style={{ backgroundColor: '#5C2D3D' }}>
                    <img src={BorduurIconn} alt="Borduren" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="text-left py-12 order-1 md:order-2">
                  <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">Borduren</h2>
                  <p className="text-base md:text-lg leading-relaxed">
                    Borduren voegt een persoonlijk en uniek element toe aan dierendekens, keukentextiel of babyartikelen zoals badjasjes, badcapejes, handdoekjes, rompertjes, slabbetjes en nog veel meer.
                  </p>
                  <p className="text-base md:text-lg leading-relaxed mt-4">
                    Een naam, tekst of afbeelding op een item borduren maakt het item speciaal en persoonlijk voor jezelf of om iemand cadeau te geven.
                  </p>
                  <p className="text-base md:text-lg leading-relaxed mt-4">
                    Geborduurde items blijven langer mooi en de kleuren vervagen niet zo snel waardoor ze langer meegaan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {favorites.length > 0 && (
          <div className="mb-12">
            <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
              <section className="stage relative">
                <div className="stage-top"></div>
                <div className="stars"></div>
                <div className="stars2"></div>
                <div className="stars3"></div>
                <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-6 pb-12 favorites-container-pad">
                  <h2 className="text-white text-2xl font-semibold text-center mb-4">Favorieten</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {favorites.slice(0, 3).map((item, idx) => {
                      const rank = idx + 1
                      const first = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null
                      const meta = itemIdToCategory[item.id] || { slug: '' }
                      const catSlug = meta.slug
                      const itemSlug = slugify(item.name)
                      const href = catSlug ? `/werkjes/${catSlug}/${itemSlug}` : undefined
                      const card = (
                        <div className="relative rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
                          <div className="aspect-[940/788] bg-gray-100 overflow-hidden rounded-2xl">
                            {first ? (
                              <img src={first} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">Geen afbeelding</div>
                            )}
                          </div>
                        </div>
                      )
                      return (
                        <div key={`fav-${item.id}-${rank}`}>
                          {href ? (
                            <Link to={href} className="block">
                              {card}
                            </Link>
                          ) : (
                            card
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="stage-bottom"></div>
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


