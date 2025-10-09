import { useState, useEffect } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

interface EscalatorCarouselProps {
  images: string[]
  className?: string
}

export function EscalatorCarousel({ images, className = '' }: EscalatorCarouselProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 425)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Preload images to ensure smooth animation
  useEffect(() => {
    if (images.length === 0) return

    images.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [images])

  const settings = {
    infinite: true,
    speed: isMobile ? 15000 : 20000, // 15 seconds mobile, 20 seconds desktop
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
