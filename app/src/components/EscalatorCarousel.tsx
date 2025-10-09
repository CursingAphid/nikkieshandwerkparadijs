import { useState, useEffect, useMemo } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

interface EscalatorCarouselProps {
  images: string[]
  className?: string
}

export function EscalatorCarousel({ images, className = '' }: EscalatorCarouselProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth <= 425
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile)
      }
    }
    
    checkMobile()
    setIsInitialized(true)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isMobile])

  // Preload images to ensure smooth animation
  useEffect(() => {
    if (images.length === 0) return

    images.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [images])

  // Use consistent speed to prevent restart issues
  const settings = useMemo(() => ({
    infinite: true,
    speed: 45000, // 45 seconds - very slow and gentle
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0, // Keep at 0 for continuous movement
    arrows: false,
    pauseOnHover: false,
    pauseOnFocus: false,
    pauseOnDotsHover: false,
    swipe: false,
    touchMove: false,
    fade: false,
    cssEase: 'linear',
    variableWidth: true,
    adaptiveHeight: false,
  }), []) // Empty dependency array - settings never change

  // Don't render until we know the screen size
  if (!isInitialized) {
    return null
  }

  return (
    <div 
      className={`absolute left-0 right-0 h-[180px] sm:h-[140px] md:h-[160px] lg:h-[200px] z-5 escalator-slide-in overflow-hidden ${className}`}
      style={{ bottom: '-5px' }}
    >
      <Slider {...settings}>
        {images.map((url, index) => (
          <div key={`escalator-${index}`} className="px-4">
            <img
              src={url}
              alt="Escalator image"
              className="h-[180px] sm:h-[140px] md:h-[160px] lg:h-[200px] w-auto select-none pointer-events-none"
              loading="eager"
            />
          </div>
        ))}
      </Slider>
    </div>
  )
}
