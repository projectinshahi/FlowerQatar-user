'use client'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const container: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 }
  }
}

const item: any = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">
      {/* 
        Background Video Container 
        Using responsive 16:9 math to ensure no black bars ever show on any device size.
      */}
      <div className="absolute inset-0 overflow-hidden bg-secondary z-0">
        <iframe
          src="https://www.youtube.com/embed/0jZadntg3ng?autoplay=1&mute=1&loop=1&playlist=0jZadntg3ng&controls=0&rel=0&modestbranding=1&disablekb=1&playsinline=1&iv_load_policy=3&fs=0&enablejsapi=1"
          allow="autoplay; encrypted-media"
          className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ border: 'none' }}
          tabIndex={-1}
          aria-hidden="true"
          draggable={false}
        />
        
        {/* 
          Absolute Blocking Overlay 
          This transparent div sits perfectly on top of the iframe and intercepts EVERY SINGLE user interaction.
          Because it has NO pointer-events-none class, it acts as an impenetrable shield.
          The user can click, tap, drag, or swipe here, and the iframe underneath will never know it happened.
        */}
        <div 
          className="absolute inset-0 z-10 bg-transparent" 
          aria-hidden="true"
          onContextMenu={(e) => e.preventDefault()} // Block right click
        />
        
        {/* Gradient styling overlay to ensure text remains readable */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="absolute bottom-16 left-0 p-12 md:p-16 max-w-[500px] z-30 pointer-events-none"
      >
        <motion.h1 variants={item} className="font-serif text-5xl md:text-7xl text-white font-light tracking-wide leading-tight">
          A SEASON IN BLOOM
        </motion.h1>
        
        <motion.p variants={item} className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/90 mt-4">
          REAL FLOWERS THAT LAST A YEAR
        </motion.p>
        
        <motion.p variants={item} className="font-sans text-sm text-white/80 mt-4 leading-relaxed">
          Sun, sea, and the ancient symbol of protection. Summer is here. New prints, new shades, and the Eternity® Blooms that last all season long.
        </motion.p>
        
        <motion.div variants={item} className="pointer-events-auto">
          <Link
            href="#"
            className="inline-block bg-white text-secondary px-8 py-4 font-sans text-[11px] uppercase tracking-[0.15em] hover:bg-secondary hover:text-white transition-colors duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] mt-8"
          >
            SHOP SUMMER FLORALS
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom Bar Carousel UI */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-sage/90 flex items-center justify-between px-4 md:px-12 backdrop-blur-sm z-30">
        <button className="text-white hover:text-secondary transition-colors duration-300" aria-label="Previous slide">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-4 text-white text-[11px] uppercase tracking-[0.15em] font-sans">
          <span>A SEASON IN BLOOM</span>
          <span className="w-1 h-1 rounded-full bg-white/50" />
          <Link href="#" className="hover:text-secondary transition-colors duration-300">SHOP SUMMER FLORALS</Link>
        </div>
        <button className="text-white hover:text-secondary transition-colors duration-300" aria-label="Next slide">
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  )
}
