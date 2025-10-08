import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface EscalatorAnimationProps {
  images: string[]
  className?: string
}

export function EscalatorAnimation({ images, className = '' }: EscalatorAnimationProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 425
      console.log('Screen width:', window.innerWidth, 'Is mobile:', mobile)
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <>
      {images.map((url, index) => (
        <motion.img
          key={`escalator-${index}-${isMobile ? 'mobile' : 'desktop'}`}
          src={url}
          alt="Escalator image"
          className={`absolute bottom-0 left-[-200px] sm:left-[-300px] md:left-[-400px] lg:left-[-500px] w-auto h-[120px] sm:h-[140px] md:h-[160px] lg:h-[200px] select-none pointer-events-none z-5 ${className}`}
          initial={{ x: 0 }}
          animate={{ 
            x: ['0vw', '200vw'],
          }}
          transition={{
            duration: isMobile ? 35 : 49, // Mobile: 35s duration (faster), Desktop: 49s duration
            delay: index === 0 ? 0 : index * (isMobile ? 5 : 7), // Mobile: 5s delay, Desktop: 7s delay
            repeat: Infinity,
            ease: 'linear'
          }}
          onAnimationStart={() => {
            if (index === 0) {
              console.log('Animation starting - isMobile:', isMobile, 'duration:', isMobile ? 28 : 42, 'delay:', index === 0 ? 0 : index * (isMobile ? 4 : 6))
            }
          }}
        />
      ))}
    </>
  )
}
