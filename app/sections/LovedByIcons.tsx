'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '../../components/AnimatedSection'

const testimonials = [
  {
    name: "GIGI HADID",
    handle: "@GIGIHADID",
    quote: "Thank you for your kindness and generosity with your amazing flowers! Forever fan!",
    stars: 5,
    image: "/images/about_florist_1782290182382.png",
    product: {
      image: "/images/product_master_1_1782290164345.png",
      title: "GIA MARBLE VASE",
      subtitle: "Handcarved Marble / White Roses",
      price: "$689"
    }
  },
  {
    name: "ASHLEY BENSON",
    handle: "@ASHLEYBENSON",
    quote: "I just love love love and love your flowers!",
    stars: 5,
    image: "/images/about_florist_1782290182382.png",
    product: {
      image: "/images/product_master_1_1782290164345.png",
      title: "SMALL SQUARE",
      subtitle: "Parisian-Style Box / Red Roses",
      price: "$299"
    }
  },
  {
    name: "DIXIE D'AMELIO",
    handle: "@DIXIEDAMELIO",
    quote: "Always gorgeous.",
    stars: 5,
    image: "/images/about_florist_1782290182382.png",
    product: {
      image: "/images/product_master_1_1782290164345.png",
      title: "LARGE SQUARE",
      subtitle: "Parisian-Style Box / Red Roses",
      price: "$399"
    }
  }
]

export default function LovedByIcons() {
  const [currentIndex, setCurrentIndex] = useState(testimonials.length)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const displayItems = [...testimonials, ...testimonials, ...testimonials]

  const nextSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev - 1)
  }

  const handleTransitionEnd = () => {
    setIsTransitioning(false)
    if (currentIndex === 0) {
      setCurrentIndex(testimonials.length)
    } else if (currentIndex >= testimonials.length * 2) {
      setCurrentIndex(testimonials.length)
    }
  }

  return (
    <AnimatedSection className="py-24 bg-white">
      <style>{`
        .carousel-track { --slide-width: 100%; }
        @media (min-width: 768px) { .carousel-track { --slide-width: 33.333333%; } }
      `}</style>
      
      <div className="max-w-[1400px] mx-auto px-4 md:px-12">
        <h2 className="font-sans text-[11px] uppercase tracking-[0.2em] font-semibold text-primary text-center mb-16">
          LOVED BY ICONS
        </h2>
        
        <div className="relative group">
          <div className="overflow-hidden">
            <div 
              className={`carousel-track flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
              style={{ transform: `translateX(calc(-${currentIndex} * var(--slide-width)))` }}
              onTransitionEnd={handleTransitionEnd}
            >
              {displayItems.map((testimonial, idx) => (
                <div key={idx} className="w-full md:w-1/3 flex-shrink-0 px-4 md:px-8">
                  <div className="flex flex-col items-center text-center h-full">
                    {/* Profile Image */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-6 flex-shrink-0">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Name & Handle */}
                    <h3 className="font-serif text-xl text-primary tracking-widest mb-1">
                      {testimonial.name}
                    </h3>
                    <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-muted mb-4">
                      {testimonial.handle}
                    </p>
                    
                    {/* Quote */}
                    <p className="font-serif text-sm md:text-base text-primary mb-4 flex-grow px-2 md:px-6">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    
                    {/* Stars */}
                    <div className="flex text-[#D4AF37] mb-8">
                      {[...Array(testimonial.stars)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                    
                    {/* Product Card Attachment */}
                    <Link href="#" className="w-full bg-[#FAFAFA] border border-[#F0F0F0] p-4 flex items-center hover:bg-[#F5F5F5] transition-colors">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-white">
                        <Image
                          src={testimonial.product.image}
                          alt={testimonial.product.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-grow text-left">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-serif text-sm md:text-base text-primary uppercase tracking-wide">
                            {testimonial.product.title}
                          </h4>
                          <span className="font-sans text-[10px] text-primary">
                            {testimonial.product.price}
                          </span>
                        </div>
                        <p className="font-sans text-[10px] text-muted">
                          {testimonial.product.subtitle}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={prevSlide}
            className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-2 md:-translate-x-8 w-10 h-10 flex items-center justify-center bg-white border border-divider text-primary rounded-full hover:bg-cream transition-colors z-10"
            aria-label="Previous testimonial"
            suppressHydrationWarning
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-2 md:translate-x-8 w-10 h-10 flex items-center justify-center bg-white border border-divider text-primary rounded-full hover:bg-cream transition-colors z-10"
            aria-label="Next testimonial"
            suppressHydrationWarning
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </AnimatedSection>
  )
}
