'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function BrandStory() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"])

  return (
    <section ref={containerRef} className="relative h-[500px] md:h-[700px] lg:h-[800px] overflow-hidden bg-secondary">
      {/* Parallax Background */}
      <motion.div style={{ y }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
        <Image
          src="/images/about_florist_1782290182382.png"
          alt="Deep red roses"
          fill
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-primary/70 mix-blend-multiply" />
      </motion.div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center max-w-3xl"
        >
          <h2 className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/80 text-center">
            WHO WE ARE
          </h2>
          
          <p className="font-serif text-2xl md:text-4xl text-white font-light text-center leading-snug mt-6">
            PIONEERS OF ETERNITY FLOWERS <br className="hidden md:block" />
            <span className="md:hidden">/ </span>
            LUXURY THAT LASTS ALL YEAR <br className="hidden md:block" />
            <span className="md:hidden">/ </span>
            CRAFTSMANSHIP IN EVERY PETAL <br className="hidden md:block" />
            <span className="md:hidden">/ </span>
            EXCLUSIVELY MADE TO ORDER
          </p>
          
          <Link
            href="#"
            className="border border-white text-white px-8 py-4 font-sans text-[11px] uppercase tracking-[0.15em] hover:bg-white hover:text-[#2a0015] transition-colors duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] mt-10 inline-block"
          >
            LEARN MORE
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
