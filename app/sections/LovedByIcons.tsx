'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '../components/AnimatedSection'

const testimonials = [
  {
    name: "Gigi Hadid",
    handle: "@gigihadid",
    quote: "Thank you for your kindness and generosity with your amazing flowers! Forever fan!",
    stars: 5,
    image: "/images/about_florist_1782290182382.png"
  },
  {
    name: "Dixie D'Amelio",
    handle: "@dixiedamelio",
    quote: "Always gorgeous. The most beautiful roses.",
    stars: 5,
    image: "/images/about_florist_1782290182382.png"
  },
  {
    name: "Kim Kardashian",
    handle: "@kimkardashian",
    quote: "My favorite roses ever! So beautiful.",
    stars: 5,
    image: "/images/about_florist_1782290182382.png"
  }
]

export default function LovedByIcons() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <AnimatedSection className="py-24 bg-[#FFF8F5]">
      <div className="max-w-6xl mx-auto px-4 md:px-12">
        <h2 className="font-serif text-3xl md:text-4xl text-primary text-center mb-16">
          LOVED BY ICONS
        </h2>
        
        <div className="relative">
          <div className="overflow-hidden">
            <motion.div 
              className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, idx) => (
                <div key={idx} className="w-full flex-shrink-0 px-4">
                  <div className="luxury-card p-12 max-w-3xl mx-auto text-center bg-white flex flex-col items-center">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden mb-6 border border-divider">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex text-secondary mb-6">
                      {[...Array(testimonial.stars)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <p className="font-serif text-2xl md:text-3xl text-primary font-light mb-6">
                      "{testimonial.quote}"
                    </p>
                    <h3 className="font-sans text-[11px] uppercase tracking-[0.15em] font-semibold text-primary">
                      {testimonial.name}
                    </h3>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-muted mt-1">
                      {testimonial.handle}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <button 
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 p-3 bg-white border border-divider text-primary hover:bg-cream transition-colors z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 p-3 bg-white border border-divider text-primary hover:bg-cream transition-colors z-10"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </AnimatedSection>
  )
}