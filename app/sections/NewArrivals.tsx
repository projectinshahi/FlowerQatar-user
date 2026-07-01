'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Heart, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '../../components/AnimatedSection'

interface Product {
  id: string;
  slug: string;
  badge: string;
  name: string;
  subtitle: string;
  price: number;
  rating: number;
  swatches: string[];
  image: string;
  hoverImage: string;
}
const products: Product[] = [
  {
    id: "1",
    slug: "classic-round-box",
    badge: "NEW COLOR",
    name: "Wicker Mixed Globe",
    subtitle: "MIXED FLORALS • JARDIN BLANC",
    price: 199,
    rating: 4.3,
    swatches: ["#FFFFFF", "#9CAF88"],
    image: "/images/product_master_1_1782290164345.png",
    hoverImage: "/images/category_gift_boxes_1782290153364.png"
  },
  {
    id: "2",
    slug: "classic-round-box",
    badge: "BESTSELLER",
    name: "Classic Round",
    subtitle: "ETERNITY ROSES • BURGUNDY",
    price: 299,
    rating: 4.9,
    swatches: ["#61000B", "#FFF6F0"],
    image: "/images/category_bouquets_1782290106325.png",
    hoverImage: "/images/product_master_1_1782290164345.png"
  },
  {
    id: "3",
    slug: "classic-square-box",
    badge: "LIMITED",
    name: "Artisanal Chocolates",
    subtitle: "LUXURY GIFT BOX",
    price: 150,
    rating: 4.8,
    swatches: ["#3E2723", "#D7CCC8"],
    image: "/images/category_chocolates_1782290122821.png",
    hoverImage: "/images/product_master_1_1782290164345.png"
  },
  {
    id: "4",
    slug: "le-mini-xo",
    badge: "NEW",
    name: "Le Mini Set",
    subtitle: "ETERNITY ROSES • SOFT PINK",
    price: 129,
    rating: 4.5,
    swatches: ["#D994B0", "#FFF6F0"],
    image: "/images/product_master_1_1782290164345.png",
    hoverImage: "/images/category_bouquets_1782290106325.png"
  }
]

export default function NewArrivals() {
  const [currentIndex, setCurrentIndex] = useState(products.length)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const displayItems = [...products, ...products, ...products]

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
      setCurrentIndex(products.length)
    } else if (currentIndex >= products.length * 2) {
      setCurrentIndex(products.length)
    }
  }

  return (
    <AnimatedSection className="py-16 md:py-24 bg-[#FFF6F0]">
      <style>{`
        .carousel-track-new-arrivals { --slide-width: 100%; }
        @media (min-width: 768px) { .carousel-track-new-arrivals { --slide-width: 33.333333%; } }
      `}</style>
      <div className="w-full relative">
        <div className="flex justify-between items-end mb-12 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div>
            <h2 className="font-serif text-[48px] text-primary font-light leading-[1.2]">
              NEW ARRIVALS
            </h2>
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted mt-4">
              THE LATEST IN LUXURY GIFTING
            </p>
          </div>
          
          {/* Top Right Navigation Controls */}
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <Link href="/shop" className="hidden md:block font-sans text-[11px] uppercase tracking-[0.15em] text-primary hover:text-secondary transition-colors border-b border-primary pb-1 mr-4">
              VIEW ALL
            </Link>
            
            <div className="flex gap-2">
              <button 
                onClick={prevSlide}
                className="w-10 h-10 flex items-center justify-center bg-transparent border border-divider text-primary rounded-full hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous product"
                suppressHydrationWarning
              >
                <ArrowLeft size={16} strokeWidth={1} />
              </button>
              <button 
                onClick={nextSlide}
                className="w-10 h-10 flex items-center justify-center bg-transparent border border-divider text-primary rounded-full hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next product"
                suppressHydrationWarning
              >
                <ArrowRight size={16} strokeWidth={1} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div 
            className={`carousel-track-new-arrivals flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
            style={{ transform: `translateX(calc(-${currentIndex} * var(--slide-width)))` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {displayItems.map((product, idx) => (
              <div key={`${product.id}-${idx}`} className="w-full md:w-1/3 flex-shrink-0">
                <div className="luxury-card flex flex-col h-full bg-white relative hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream/20 group">
                    <Link href={`/product/${product.slug}`} className="block absolute inset-0 z-10" aria-label={`View ${product.name}`}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                      />
                      <Image
                        src={product.hoverImage}
                        alt={`${product.name} alternate view`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 scale-105"
                      />
                    </Link>
                    {product.badge && (
                      <div className="absolute top-4 left-4 bg-secondary text-white text-[9px] uppercase tracking-widest px-3 py-1 font-semibold z-10">
                        {product.badge}
                      </div>
                    )}
                    <button className="absolute top-4 right-4 text-primary hover:text-accent transition-colors z-20 cursor-pointer" aria-label="Add to wishlist" suppressHydrationWarning>
                      <Heart size={20} />
                    </button>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow relative">
                    <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10 block" aria-label={`View ${product.name}`}>
                      <span className="sr-only">View product</span>
                    </Link>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif text-[22px] text-primary">{product.name}</h3>
                      <span className="font-sans text-[16px] text-primary font-medium">QAR {product.price}</span>
                    </div>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-muted mb-4">{product.subtitle}</p>
                    
                    <div className="mt-auto pt-4 border-t border-divider flex justify-between items-center">
                      <div className="flex gap-2">
                        {product.swatches.map((color, colorIdx) => (
                          <div 
                            key={colorIdx}
                            className="w-4 h-4 rounded-full border border-divider/50"
                            style={{ backgroundColor: color }}
                            aria-label="Color swatch"
                          />
                        ))}
                      </div>
                      <div className="flex items-center text-primary">
                        <Star size={12} fill="currentColor" className="mr-1" />
                        <span className="text-[11px] font-medium">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
        
        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden px-6">
          {/* <Link href="/shop" className="btn-primary inline-block px-8 py-4 w-full">
            VIEW ALL ARRIVALS
          </Link> */}
        </div>
      </div>
    </AnimatedSection>
  )
}
