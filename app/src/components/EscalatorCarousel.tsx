import { useState, useEffect } from 'react'

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

  return (
    <div 
      className={`absolute left-0 right-0 h-[180px] sm:h-[140px] md:h-[160px] lg:h-[200px] z-5 escalator-slide-in overflow-hidden ${className}`}
      style={{ bottom: '-5px' }}
    >
      <div 
        className="flex h-full"
        style={{
          animation: `scroll-right ${isMobile ? '35s' : '49s'} linear infinite`,
          animationName: 'scroll-right'
        }}
      >
        {/* First set of images */}
        {images.map((url, index) => (
          <img
            key={`first-${index}`}
            src={url}
            alt="Escalator image"
            className="h-[180px] sm:h-[140px] md:h-[160px] lg:h-[200px] w-auto select-none pointer-events-none flex-shrink-0 mr-8"
          />
        ))}
        {/* Second set for seamless loop */}
        {images.map((url, index) => (
          <img
            key={`second-${index}`}
            src={url}
            alt="Escalator image"
            className="h-[180px] sm:h-[140px] md:h-[160px] lg:h-[200px] w-auto select-none pointer-events-none flex-shrink-0 mr-8"
          />
        ))}
      </div>
    </div>
  )
}
