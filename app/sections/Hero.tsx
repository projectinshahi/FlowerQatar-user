'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const slides = [
  {
    title: "A SEASON IN BLOOM",
    subtitle: "REAL FLOWERS THAT LAST A YEAR",
    description: "Sun, sea, and the ancient symbol of protection. Summer is here. New prints, new shades, and the Eternity® Blooms that last all season long.",
    buttonText: "SHOP SUMMER FLORALS",
    buttonLink: "/shop"
  },
  {
    title: "THE BRIDAL COLLECTION",
    subtitle: "UNFORGETTABLE WEDDING FLORALS",
    description: "Celebrate love with our exquisite bridal arrangements. Handcrafted luxury roses that perfectly capture the magic of your special day.",
    buttonText: "EXPLORE BRIDAL",
    buttonLink: "/shop"
  },
  {
    title: "LUXURY GIFTING",
    subtitle: "CURATED FOR EVERY OCCASION",
    description: "Make a lasting impression with our signature gift boxes and artisanal chocolates. The perfect gesture of appreciation and love.",
    buttonText: "SHOP GIFTS",
    buttonLink: "/shop"
  }
]

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0)
  // Removed mounted state for better LCP

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)

  const slide = slides[currentIndex]

  return (
    <section className="relative h-[75vh] md:h-[95vh] lg:h-screen min-h-[600px] overflow-hidden">
      {/* Background Video Container */}
      <div className="absolute inset-0 overflow-hidden bg-secondary z-0">
          <iframe
            src="https://www.youtube.com/embed/0jZadntg3ng?autoplay=1&mute=1&loop=1&playlist=0jZadntg3ng&controls=0&rel=0&modestbranding=1&disablekb=1&playsinline=1&iv_load_policy=3&fs=0&enablejsapi=1"
            allow="autoplay; encrypted-media"
            className="absolute top-1/2 left-1/2 w-screen h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
            style={{ border: 'none' }}
            tabIndex={-1}
            aria-hidden="true"
            draggable={false}
          />
        
        {/* Absolute Blocking Overlay */}
        <div 
          className="absolute inset-0 z-10 bg-transparent" 
          aria-hidden="true"
          onContextMenu={(e) => e.preventDefault()}
        />
        
        {/* Gradient styling overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/50 via-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-30 pointer-events-none flex items-center">
        <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col max-w-[520px]"
            >
              <h1 className="font-serif text-[48px] text-white font-light tracking-[0.05em] leading-[1.1]">
                {slide.title}
              </h1>
              
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/90 mt-6">
                {slide.subtitle}
              </p>
              
              <p className="font-sans text-[16px] text-white/80 mt-4 leading-[1.6]">
                {slide.description}
              </p>
              
              <div className="pointer-events-auto mt-10">
                <Link
                  href={slide.buttonLink}
                  className="inline-block bg-white text-secondary px-8 py-4 font-sans text-[15px] uppercase tracking-[0.15em] hover:bg-secondary hover:text-white transition-colors duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                >
                  {slide.buttonText}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Bar Carousel UI */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#FFF8F5]/20 backdrop-blur-md flex items-center justify-between px-4 md:px-12 z-30 border-t border-white/10">
        <button 
          onClick={prevSlide}
          className="text-white hover:text-white/70 transition-colors duration-300 p-2" 
          aria-label="Previous slide"
          suppressHydrationWarning
        >
          <ChevronLeft size={20} />
        </button>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-4 text-white text-[11px] uppercase tracking-[0.15em] font-sans"
          >
            <span className="hidden md:inline">{slide.title}</span>
            <span className="hidden md:inline w-1 h-1 rounded-full bg-white/50" />
            <Link href={slide.buttonLink} className="hover:text-white/70 transition-colors duration-300">
              {slide.buttonText}
            </Link>
          </motion.div>
        </AnimatePresence>
        
        <button 
          onClick={nextSlide}
          className="text-white hover:text-white/70 transition-colors duration-300 p-2" 
          aria-label="Next slide"
          suppressHydrationWarning
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  )
}
