import { useEffect } from 'react'
import Marquee from 'react-fast-marquee'

interface EscalatorCarouselProps {
  images: string[]
  className?: string
}

export function EscalatorCarousel({ images, className = '' }: EscalatorCarouselProps) {

  // Preload images to ensure smooth animation
  useEffect(() => {
    if (images.length === 0) return

    images.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [images])

  return (
    <div 
      className={`absolute left-0 right-0 h-[180px] sm:h-[140px] md:h-[160px] lg:h-[200px] z-5 escalator-slide-in overflow-hidden ${className}`}
      style={{ bottom: '-5px' }}
    >
      <Marquee
        speed={45}
        gradient={false}
        pauseOnHover={false}
        pauseOnClick={false}
        direction="left"
        autoFill={true}
      >
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
      </Marquee>
    </div>
  )
}
