'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
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
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 scale-105 [@media(hover:none)]:hidden"
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
  // The row scrolls only when there are more products than fit one desktop view (3).
  // With 1–3 flagged products we render a simple static row.
  const useCarousel = products.length > 3

  /*
   * The same scrolling row as "You may also like" on a product page: a real scroll container
   * with scroll snapping, so a swipe (or a trackpad, or a dragged scrollbar) moves it natively,
   * and the arrows simply scroll it by one card. It stops at both ends — no wrap-around — which
   * is what makes the arrows' disabled state meaningful.
   */
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [edges, setEdges] = useState({ canScrollLeft: false, canScrollRight: false })

  /**
   * Which way the row can still move. The 2px tolerance absorbs sub-pixel rounding — an exact
   * comparison leaves `scrollLeft` a fraction short of the maximum, so the end is never
   * detected and the right arrow stays enabled on a row that cannot move any further.
   */
  const measure = useCallback((track: HTMLDivElement | null) => {
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    const canScrollLeft = track.scrollLeft > 2
    // `max <= 2` means everything already fits, so there is nothing to scroll to.
    const canScrollRight = max > 2 && track.scrollLeft < max - 2
    // Runs on every scroll event: keep the same object unless an edge changed, so React skips
    // the re-render while the row is being swiped.
    setEdges((p) =>
      p.canScrollLeft === canScrollLeft && p.canScrollRight === canScrollRight ? p : { canScrollLeft, canScrollRight }
    )
  }, [])

  /** Callback ref: measures as soon as the row is in the DOM. */
  const attachTrack = useCallback(
    (track: HTMLDivElement | null) => {
      trackRef.current = track
      measure(track)
    },
    [measure]
  )

  // Card widths are percentage-based, so a resize changes where the end is.
  useEffect(() => {
    const onResize = () => measure(trackRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  /**
   * Scroll by exactly one card, clamped to the ends.
   *
   * The step is the distance between the first two cards' left edges, which is correct at
   * every breakpoint (the cards are percentage-based, so a hardcoded width would be wrong on
   * mobile). Falls back to the viewport width when there is only one card to measure.
   */
  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const [first, second] = track.children as unknown as HTMLElement[]
    const step = first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth
    const max = track.scrollWidth - track.clientWidth
    const left = Math.min(max, Math.max(0, track.scrollLeft + direction * step))
    track.scrollTo({ left, behavior: 'smooth' })
  }

  // No admin-flagged New Arrivals → don't render the section at all.
  if (products.length === 0) return null

  return (
    <AnimatedSection className="py-16 md:py-24 bg-[#FFF6F0]">
      <div className="w-full relative">
        <div className="flex justify-between items-end mb-12 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div>
            {/* 40px below 360px only: at 320px the 48px title's longest word plus the two arrows
                did not fit, and the Next arrow sat 13px off-screen. 360px and up are unchanged. */}
            <h2 className="font-serif text-[40px] min-[360px]:text-[48px] text-primary font-light leading-[1.2]">
              NEW ARRIVALS
            </h2>
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted mt-4">
              THE LATEST IN LUXURY GIFTING
            </p>
          </div>

          {/* Top Right Navigation Controls */}
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            {useCarousel && (
              <div className="flex gap-2">
                <button
                  onClick={() => scrollByCard(-1)}
                  disabled={!edges.canScrollLeft}
                  className="w-10 h-10 flex items-center justify-center bg-transparent border border-divider text-primary rounded-full hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous product"
                  aria-controls="new-arrivals-track"
                  suppressHydrationWarning
                >
                  <ArrowLeft size={16} strokeWidth={1} />
                </button>
                <button
                  onClick={() => scrollByCard(1)}
                  disabled={!edges.canScrollRight}
                  className="w-10 h-10 flex items-center justify-center bg-transparent border border-divider text-primary rounded-full hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next product"
                  aria-controls="new-arrivals-track"
                  suppressHydrationWarning
                >
                  <ArrowRight size={16} strokeWidth={1} />
                </button>
              </div>
            )}
          </div>
        </div>

        {useCarousel ? (
          <div
            id="new-arrivals-track"
            ref={attachTrack}
            onScroll={(e) => measure(e.currentTarget)}
            /* Scrollbar hidden so the row looks exactly as it did while it was a transform. */
            className="carousel-track-new-arrivals flex overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => (
              <div key={product.id} className="w-full md:w-1/3 flex-shrink-0 snap-start">
                <NewArrivalCard product={product} />
              </div>
            ))}
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
