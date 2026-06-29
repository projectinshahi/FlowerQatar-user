'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '../../components/AnimatedSection'

const columns = [
  { text: "ETERNITY FLOWERS", link: "#" },
  { text: "OUR STORY", link: "#" },
  { text: "FAQS", link: "#" }
]

export default function ArtTriptych() {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)

  return (
    <AnimatedSection className="relative bg-secondary h-[600px] md:h-[800px]">
      {/* Shared Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/ART.png"
          alt="Birth of Venus"
          fill
          sizes="100vw"
          className="object-cover opacity-80 object-[center_30%]"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Grid Overlay */}
      <div className="relative h-full w-full grid grid-cols-1 md:grid-cols-3">
        {columns.map((col, index) => (
          <Link
            key={index}
            href={col.link}
            onMouseEnter={() => setHoveredCol(index)}
            onMouseLeave={() => setHoveredCol(null)}
            className="relative flex items-center justify-center cursor-pointer group h-[200px] md:h-full overflow-hidden"
          >
            {/* Hover State Background Overlay (local to column) */}
            <div
              className={`absolute inset-0 bg-black/40 transition-all duration-500 ${hoveredCol !== null && hoveredCol !== index ? 'opacity-100 backdrop-blur-[2px]' : 'opacity-0'
                }`}
            />

            {/* Content Scale wrapper */}
            <div
              className={`relative z-10 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${hoveredCol === index ? 'scale-[1.05]' : 'scale-100'
                }`}
            >
              <h3 
                className="font-serif text-2xl md:text-3xl transition-colors duration-500 font-medium tracking-[0.2em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                style={{ color: hoveredCol === index ? '#E6D3BF' : '#D4B791' }}
              >
                {col.text}
              </h3>
            </div>

            {/* Desktop Vertical Dividers */}
            {index < columns.length - 1 && (
              <div className="hidden md:block absolute right-0 top-10 bottom-10 w-px bg-white/30" />
            )}

            {/* Mobile Horizontal Dividers */}
            {index < columns.length - 1 && (
              <div className="block md:hidden absolute bottom-0 left-10 right-10 h-px bg-white/30" />
            )}
          </Link>
        ))}
      </div>
    </AnimatedSection>
  )
}
