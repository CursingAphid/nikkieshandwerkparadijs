import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import Logo from '../assets/home/logo.png'
import HomeBanner from '../assets/banners/home_banner.png'
import MonkeyBench from '../assets/home/money.png'
import Giraffe from '../assets/home/giraffe.png'
import HaakIconn from '../assets/home/haakicoon.png'
import BorduurIconn from '../assets/home/borduuricoon.png'
import { EscalatorCarousel } from '../components/EscalatorCarousel'
import { ImageSlideshow } from '../components/ImageSlideshow'

type Item = {
  id: number
  name: string
  images: string[] | null
  price: number | null
  created_at: string
  order: number
}

function Home() {
  const [itemIdToCategory, setItemIdToCategory] = useState<Record<number, { slug: string; type?: string }>>({})
  const [favorites, setFavorites] = useState<Item[]>([])
  
  // Refs for scroll animations
  const logoRef = useRef<HTMLImageElement>(null)
  const hakenHeadingRef = useRef<HTMLHeadingElement>(null)
  const hakenTextRef = useRef<HTMLDivElement>(null)
  const hakenImageRef = useRef<HTMLDivElement>(null)
  const bordurenHeadingRef = useRef<HTMLHeadingElement>(null)
  const bordurenTextRef = useRef<HTMLDivElement>(null)
  const bordurenImageRef = useRef<HTMLDivElement>(null)
  const favoritesHeadingRef = useRef<HTMLHeadingElement>(null)
  const favoritesItemsRef = useRef<HTMLDivElement>(null)
  
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
        if (!cancelled) setFavorites(favs)
        // Load first category slug for each item (best-effort)
        const entries = await Promise.all(
          favs.map(async (it) => {
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
        // Error handling removed since error state was removed
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Scroll-based animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px 200px 0px' // Increased from -50px to 200px for earlier triggering
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
        }
      })
    }, observerOptions)

    // Observe all animation elements including favorites
    const elementsToAnimate = [
      logoRef.current,
      hakenHeadingRef.current,
      hakenTextRef.current,
      hakenImageRef.current,
      bordurenHeadingRef.current,
      bordurenTextRef.current,
      bordurenImageRef.current,
      favoritesHeadingRef.current,
      favoritesItemsRef.current
    ].filter(Boolean)

    elementsToAnimate.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => {
      elementsToAnimate.forEach((el) => {
        if (el) observer.unobserve(el)
      })
    }
  }, [favorites.length]) // Re-run when favorites load

  return (
    <div className="overflow-hidden">
      {/* Full-bleed title section */}
      <section className="w-full relative overflow-visible" style={{ backgroundImage: `url(${HomeBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="relative z-50 mx-auto max-w-6xl px-4 pt-8 pb-40 md:pt-12 md:pb-36 lg:pt-16 lg:pb-40 flex flex-col items-center justify-end">
          <img 
            ref={logoRef}
            src={Logo} 
            alt="Nikkie's Handwerk Paradijs" 
            className="logo-pop-in w-72 md:w-72 lg:w-80 h-auto relative z-50" 
          />
          <div className="mt-4 md:mt-6 text-center text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.85), 0 6px 16px rgba(0,0,0,0.35)' }}>
          </div>
        </div>
        <img 
          src={MonkeyBench} 
          alt="Aap op bankje"
          className="animal-drop absolute -top-2.5 right-[2%] md:right-[4%] lg:right-[6%] w-auto h-[140px] sm:h-[170px] md:h-[200px] lg:h-[250px] select-none pointer-events-none z-5 hidden sm:block"
        />
        <img 
          src={Giraffe} 
          alt="Giraffe"
          className="animal-drop-delayed absolute -top-2.5 left-[2%] md:left-[10%] lg:left-[12%] w-auto h-[160px] sm:h-[190px] md:h-[220px] lg:h-[270px] select-none pointer-events-none z-5 hidden sm:block"
        />
        <EscalatorCarousel images={escalatorUrls} />
      </section>

      <main className="mx-auto max-w-6xl px-4 pt-0">
        {/* Haken and Borduren sections */}
        <section className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-800 text-white">
          {/* Haken Section - Text left, Icon right - full width with gray-700 */}
          <div className="bg-gray-700">
            <div className="mx-auto max-w-6xl px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                <div className="text-left pb-6 md:py-12">
                  <h2 ref={hakenHeadingRef} className="font-heading text-3xl md:text-4xl font-bold mb-6 fade-in-up pt-6 md:pt-0">Haken</h2>
                  <div ref={hakenTextRef} className="fade-in-up">
                    <p className="text-base md:text-lg leading-relaxed">
                      Het haken van knuffels of kraamcadeaus is een populair tijdsverdrijf als je graag creatief bezig wilt zijn. Het is een geweldige manier om iets persoonlijks en unieks te maken. Door verschillende kleuren en garens te gebruiken kun je alles aanpassen naar de gewenste smaak.
                    </p>
                    <p className="text-base md:text-lg leading-relaxed mt-4">
                      Een ander voordeel van haken is dat het een zeer ontspannende en meditatieve bezigheid is. Het vereist geduld en precisie, wat mij helpt om stress te verminderen en de geest te ontspannen.
                    </p>
                    <div className="mt-6">
                      <Link 
                        to="/werkjes/haken" 
                        className="inline-block bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-300 transform"
                      >
                        Bekijken
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center md:justify-end items-stretch pb-6 md:py-12">
                  <div ref={hakenImageRef} className="w-full max-w-xs md:max-w-sm h-full rounded-lg overflow-hidden fade-in-up" style={{ backgroundColor: '#f3f4f6' }}>
                    <img src={HaakIconn} alt="Haken" className="w-full h-full object-cover object-right" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Borduren Section - Icon left, Text right - gray-800 background */}
          <div className="bg-gray-800">
            <div className="mx-auto max-w-6xl px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                <div className="flex justify-center md:justify-start items-stretch pb-6 md:py-12 order-2 md:order-1">
                  <div ref={bordurenImageRef} className="w-full max-w-xs md:max-w-sm h-full rounded-lg overflow-hidden fade-in-up" style={{ backgroundColor: '#f3f4f6' }}>
                    <img src={BorduurIconn} alt="Borduren" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="text-left pb-6 md:py-12 order-1 md:order-2">
                  <h2 ref={bordurenHeadingRef} className="font-heading text-3xl md:text-4xl font-bold mb-6 fade-in-up pt-6 md:pt-0">Borduren</h2>
                  <div ref={bordurenTextRef} className="fade-in-up">
                    <p className="text-base md:text-lg leading-relaxed">
                      Borduren voegt een persoonlijk en uniek element toe aan dierendekens, keukentextiel of babyartikelen zoals badjasjes, badcapejes, handdoekjes, rompertjes, slabbetjes en nog veel meer.
                    </p>
                    <p className="text-base md:text-lg leading-relaxed mt-4">
                      Een naam, tekst of afbeelding op een item borduren maakt het item speciaal en persoonlijk voor jezelf of om iemand cadeau te geven.
                    </p>
                    <p className="text-base md:text-lg leading-relaxed mt-4">
                      Geborduurde items blijven langer mooi en de kleuren vervagen niet zo snel waardoor ze langer meegaan.
                    </p>
                    <div className="mt-6">
                      <Link 
                        to="/werkjes/borduren" 
                        className="inline-block bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-300 transform"
                      >
                        Bekijken
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {favorites.length > 0 && (
          <div>
            <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
              <section className="stage relative">
                <div className="stage-top"></div>
                <div className="stars"></div>
                <div className="stars2"></div>
                <div className="stars3"></div>
                <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-6 pb-8 favorites-container-pad">
                  <h2 ref={favoritesHeadingRef} className="text-white text-2xl font-semibold text-center mb-4 fade-in-up">Favorieten</h2>
                  <div ref={favoritesItemsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-6 fade-in-up">
                    {favorites.slice(0, 3).map((item, idx) => {
                      const rank = idx + 1
                      const meta = itemIdToCategory[item.id] || { slug: '', type: '' }
                      const catSlug = meta.slug
                      const catType = meta.type || 'haken'
                      const itemSlug = slugify(item.name)
                      const href = catSlug && catType ? `/werkjes/${catType}/${catSlug}/${itemSlug}` : undefined
                      const card = (
                        <div className="relative rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.25)] bg-white overflow-hidden">
                          <div className="aspect-[940/788] bg-gray-100 overflow-hidden">
                            {Array.isArray(item.images) && item.images.length > 0 ? (
                              <ImageSlideshow
                                images={item.images}
                                alt={item.name}
                                className="transition-transform duration-300 hover:scale-105"
                                autoPlay={true}
                                autoPlayInterval={4000}
                                showDots={true}
                                showArrows={true}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">Geen afbeelding</div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-800">
                              {item.name}
                            </h3>
                            {item.price != null ? (
                              <div className="text-green-600 font-medium">
                                €{item.price.toFixed(2)}
                              </div>
                            ) : (
                              <div className="text-gray-600 font-medium">
                                Prijs in overleg
                              </div>
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

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex justify-center items-center space-x-6">
                {/* Instagram Icon */}
                <a
                  href="https://www.instagram.com/nikkieshandwerkparadijs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label="Instagram"
                >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

                {/* Facebook Icon */}
                <a
                  href="https://www.facebook.com/nikkieshandwerkparadijs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label="Facebook"
                >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>
          
          <div className="mt-4 text-center text-gray-400 text-sm">
            © 2024 Nikkie's Handwerk Paradijs. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home


