'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const slides = [
  {
    title: "A SEASON IN BLOOM",
    buttonText: "SHOP SUMMER FLORALS",
    buttonLink: "/shop"
  },
  {
    title: "THE BRIDAL COLLECTION",
    buttonText: "EXPLORE BRIDAL",
    buttonLink: "/shop"
  },
  {
    title: "LUXURY GIFTING",
    buttonText: "SHOP GIFTS",
    buttonLink: "/shop"
  }
]

export default function TopAnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)

  // Hide on homepage where the Hero section already has this bar at the bottom
  if (pathname === '/') {
    return null
  }

  return (
    <div className="w-full h-10 bg-[#b0aca7] flex items-center justify-between px-4 md:px-12 z-50 text-white relative">
      <button 
        onClick={prevSlide}
        className="hover:text-white/70 transition-colors duration-300 p-1" 
        aria-label="Previous announcement"
        suppressHydrationWarning
      >
        <ChevronLeft size={16} />
      </button>
      
      {/* Every slide stays mounted so Google Translate's Arabic survives each rotation; re-keying
          a fresh node every tick put the English back. The leaving slide fades up and out, then
          the next enters from below — the same sequence AnimatePresence mode="wait" produced. */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center justify-center">
        {slides.map((slide, i) => {
          const active = i === currentIndex
          return (
            <motion.div
              key={i}
              aria-hidden={!active}
              inert={!active}
              initial={{ opacity: 0, y: 5 }}
              animate={active ? { opacity: [0, 1], y: [5, 0] } : { opacity: 0, y: -5 }}
              transition={{ duration: 0.3, delay: active ? 0.3 : 0 }}
              className={`flex flex-wrap items-center justify-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-sans text-center absolute w-full${active ? '' : ' pointer-events-none'}`}
            >
              <span className="font-medium">{slide.title}</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/50" />
              <Link href={slide.buttonLink} className="underline underline-offset-4 hover:text-white/70 transition-colors duration-300">
                {slide.buttonText}
              </Link>
            </motion.div>
          )
        })}
      </div>
      
      <button 
        onClick={nextSlide}
        className="hover:text-white/70 transition-colors duration-300 p-1" 
        aria-label="Next announcement"
        suppressHydrationWarning
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
