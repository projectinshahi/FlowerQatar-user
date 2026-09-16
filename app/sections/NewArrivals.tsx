'use client'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Heart, Star } from 'lucide-react'
import LuxuryImage from '@/components/LuxuryImage'
import Link from 'next/link'
import { AnimatedSection } from '../../components/AnimatedSection'
import { useApp } from '@/context/AppContext'

interface Swatch {
  name: string;
  hex: string;
  image: string;
  hoverImage: string;
}

interface Product {
  id: string;
  slug: string;
  badge: string;
  name: string;
  price: number;
  rating: number;
  swatches: Swatch[];
  image: string;
  hoverImage: string;
}

/**
 * A single New Arrivals card. Clicking a color swatch swaps the card image to that
 * color variant's own photo (data comes straight from the product's DB variants).
 */
function NewArrivalCard({ product }: { product: Product }) {
  const swatches = product.swatches ?? []
  const [active, setActive] = useState(0)
  const { wishlist, toggleWishlist } = useApp()
  const isWishlisted = wishlist.includes(product.slug)

  const selected = swatches[active]
  const mainImage = selected?.image || product.image
  const hoverImage = selected?.hoverImage || product.hoverImage

  return (
    <div className="luxury-card flex flex-col h-full bg-white relative hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream/20 group">
        <Link href={`/product/${product.slug}`} className="block absolute inset-0 z-10" aria-label={`View ${product.name}`}>
          <LuxuryImage
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
          <LuxuryImage
            src={hoverImage}
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
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.slug); }}
          className="absolute top-4 right-4 text-primary hover:text-accent transition-colors z-20 cursor-pointer"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          suppressHydrationWarning
        >
          <Heart size={20} className={isWishlisted ? 'fill-secondary text-secondary' : ''} />
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

        <div className="mt-auto pt-4 border-t border-divider flex justify-between items-center">
          {/* Color swatches sit above the card link overlay (z-20) so they're clickable. */}
          {/* <div className="relative z-20 flex gap-2">
            {swatches.map((c, i) => (
              <button
                key={`${c.name}-${i}`}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActive(i); }}
                className={`w-4 h-4 rounded-full border transition-transform hover:scale-110 ${
                  i === active ? 'ring-2 ring-offset-1 ring-primary scale-110 border-transparent' : 'border-divider/50'
                }`}
                style={{ backgroundColor: c.hex }}
                aria-label={`Show ${c.name}`}
                aria-pressed={i === active}
                title={c.name}
                // Browser extensions inject `fdprocessedid` onto buttons pre-hydration; ignore that diff.
                suppressHydrationWarning
              />
            ))}
          </div> */}
          {/* <div className="flex items-center text-primary">
            <Star size={12} fill="currentColor" className="mr-1" />
            <span className="text-[11px] font-medium">{product.rating}</span>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default function NewArrivals({ items }: { items?: Product[] }) {
  // Only products the admin flags as "New Arrival" appear here (no mock/placeholder fallback).
  const products = items ?? []
  // Loop the carousel only when there are more products than fit one desktop view (3).
  // With 1–3 flagged products we render a simple static row (no duplicate clones).
  const useCarousel = products.length > 3

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

  // No admin-flagged New Arrivals → don't render the section at all.
  if (products.length === 0) return null

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
            {/* <Link href="/shop" className="hidden md:block font-sans text-[11px] uppercase tracking-[0.15em] text-primary hover:text-secondary transition-colors border-b border-primary pb-1 mr-4">
              VIEW ALL
            </Link> */}

            {useCarousel && (
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
            )}
          </div>
        </div>

        {useCarousel ? (
          <div className="relative overflow-hidden">
            <div
              className={`carousel-track-new-arrivals flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
              style={{ transform: `translateX(calc(-${currentIndex} * var(--slide-width)))` }}
              onTransitionEnd={handleTransitionEnd}
            >
              {displayItems.map((product, idx) => (
                <div key={`${product.id}-${idx}`} className="w-full md:w-1/3 flex-shrink-0">
                  <NewArrivalCard product={product} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-y-8 px-6 md:px-12 max-w-[1440px] mx-auto">
            {products.map((product, idx) => (
              <div key={`${product.id}-${idx}`} className="w-full md:w-1/3 flex-shrink-0">
                <NewArrivalCard product={product} />
              </div>
            ))}
          </div>
        )}

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
