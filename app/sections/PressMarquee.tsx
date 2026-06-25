'use client'
import { motion } from 'framer-motion'
import { AnimatedSection } from '../../components/AnimatedSection'

const pressLogos = [
  { name: "COSMOPOLITAN", className: "font-sans font-bold tracking-widest text-xl uppercase" },
  { name: "The New York Times", className: "font-serif italic text-2xl" },
  { name: "Forbes", className: "font-serif font-bold text-2xl" },
  { name: "BAZAAR", className: "font-serif tracking-widest text-xl uppercase" },
  { name: "VOGUE", className: "font-serif tracking-widest text-2xl uppercase" },
  { name: "allure", className: "font-serif italic text-2xl lowercase tracking-wide" },
  { name: "marie claire", className: "font-serif text-xl lowercase tracking-widest" }
]

export default function PressMarquee() {
  // Duplicate for seamless loop
  const logos = [...pressLogos, ...pressLogos, ...pressLogos]

  return (
    <AnimatedSection className="bg-white py-12 overflow-hidden border-b border-charcoal/5">
      <div className="text-center mb-8">
        <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted">IN THE PRESS</h2>
      </div>
      
      <div className="relative w-full overflow-hidden flex items-center h-12">
        <motion.div
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{
            repeat: Infinity,
            duration: 30, // mobile logic will need responsive tweak, can use media query or framer motion custom
            ease: "linear",
          }}
          className="flex whitespace-nowrap items-center hover:[animation-play-state:paused]"
        >
          {logos.map((logo, idx) => (
            <div key={idx} className="flex-shrink-0 px-12 md:px-20 text-muted/60 hover:text-secondary transition-colors duration-400">
              <span className={logo.className}>{logo.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  )
}
