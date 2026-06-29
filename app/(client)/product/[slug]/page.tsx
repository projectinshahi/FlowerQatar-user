"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ChevronRight, Minus, Plus, ChevronDown, Check, ChevronLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { PRODUCTS } from '../../../../data/products'
import { useApp } from '../../../../context/AppContext'

// Define the colors from the user prompt
const PALETTE = {
  bgPrimary: '#F5F0F0',
  textPrimary: '#000000',
  textSecondary: '#8A8A8A',
  breadcrumb: '#9A9A9A',
  gold: '#C4A882',
  starGold: '#D4A843',
  buttonBg: '#000000',
  buttonText: '#FFFFFF',
  experienceBg: '#D4C8B8',
  footerBg: '#F4F0EC',
  cardBg: '#FEFEFE',
  divider: '#D5D5D5'
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  
  const product = PRODUCTS.find(p => p.slug === slug)
  const { addToCart, setCartOpen } = useApp()
  
  const [selectedColor, setSelectedColor] = useState('Coastal Blue')
  const [selectedMaterial, setSelectedMaterial] = useState('White Classic')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [openSection, setOpenSection] = useState<string | null>('description')
  const [colorViewMode, setColorViewMode] = useState<'grid' | 'list'>('grid')

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      const handlePlay = () => {
        video.play().catch(err => {
          console.log("Video play failed or was interrupted:", err)
        })
      }
      handlePlay()
      
      const preventPause = () => {
        if (video.paused) {
          handlePlay()
        }
      }
      
      video.addEventListener('pause', preventPause)
      video.addEventListener('ended', handlePlay)
      
      return () => {
        video.removeEventListener('pause', preventPause)
        video.removeEventListener('ended', handlePlay)
      }
    }
  }, [])

  const allImages = product?.images && product.images.length > 0 ? product.images : [product?.image || '']
  const thumbnails = allImages.slice(0, 5) // max 5

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      setActiveImage((prev) => (prev + 1) % allImages.length)
    } else if (e.key === 'ArrowLeft') {
      setActiveImage((prev) => (prev - 1 + allImages.length) % allImages.length)
    }
  }, [allImages.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!product) return notFound()

  const handleAddToCart = () => {
    addToCart({
      product: { slug: product.slug, name: product.name, price: product.price },
      quantity,
      roseColor: selectedColor,
      boxColor: selectedMaterial,
      boxShape: product.boxShape,
      price: product.price
    })
    setCartOpen(true)
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  // Exact data from prompt
  const displayTitle = "LARGE ROUND ROSES & HYDRANGEAS"
  const displaySubtitle = "Mixed Roses & Hydrangeas"
  const displayPrice = "$529"
  
  const customColors = [
    { name: 'Seaside Green', hex: '#8BA38D' },
    { name: 'Coastal Blue', hex: '#A3B8C8' },
    { name: 'Morning Fog', hex: '#D1D5D8' },
    { name: 'Baby Powder', hex: '#FDFDFD' },
    { name: 'Black', hex: '#111111' }
  ]

  return (
    <div style={{ backgroundColor: PALETTE.bgPrimary }} className="min-h-screen pb-0">
      
      {/* 3. BREADCRUMB */}
      <div className="max-w-[2048px] mx-auto px-4 md:px-12 py-4 border-b" style={{ borderColor: PALETTE.divider }}>
        <nav className="flex items-center text-[11px] uppercase font-sans tracking-wide" style={{ color: PALETTE.breadcrumb }}>
          <Link href="/" className="hover:text-black transition-colors">HOME</Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-black transition-colors">FLOWERS</Link>
          <span className="mx-2">/</span>
          <span className="text-black truncate">LARGE ROUND</span>
        </nav>
      </div>
      
      {/* 4. PRODUCT TWO-COLUMN LAYOUT */}
      <div className="max-w-[2048px] mx-auto px-0 md:px-12 pb-16 lg:pb-24 flex flex-col lg:flex-row gap-0 lg:gap-16 pt-0 lg:pt-10">
        
        {/* LEFT COLUMN: IMAGES (55% width desktop) */}
        <div className="w-full lg:w-[55%] flex flex-col gap-4 relative pr-0 lg:pr-8">
          <div className="w-full flex items-center gap-6">
            {/* Main Image */}
            <div className="relative flex-grow w-full aspect-[4/5] bg-white overflow-hidden group">
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image 
                    src={allImages[activeImage]} 
                    alt={displayTitle} 
                    fill 
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Vertical Dots Navigation (Desktop) */}
            {allImages.length > 1 && (
              <div className="hidden lg:flex flex-col items-center gap-4 flex-shrink-0">
                <button 
                  suppressHydrationWarning
                  onClick={() => setActiveImage(prev => (prev - 1 + allImages.length) % allImages.length)}
                  className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
                  style={{ borderColor: PALETTE.divider, color: PALETTE.textSecondary }}
                >
                  <ArrowUp size={16} strokeWidth={1.5} />
                </button>
                
                <div className="flex flex-col gap-3 py-2">
                  {allImages.map((_, idx) => (
                    <button
                      suppressHydrationWarning
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className="w-[9px] h-[9px] rounded-full transition-colors"
                      style={{ backgroundColor: activeImage === idx ? PALETTE.gold : '#E5E5E5' }}
                    />
                  ))}
                </div>

                <button 
                  suppressHydrationWarning
                  onClick={() => setActiveImage(prev => (prev + 1) % allImages.length)}
                  className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
                  style={{ borderColor: PALETTE.divider, color: PALETTE.textPrimary }}
                >
                  <ArrowDown size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}
            
            {/* Dots for mobile */}
            <div className="flex lg:hidden absolute bottom-4 left-0 right-0 justify-center gap-2 px-4 z-10">
              {allImages.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full ${activeImage === idx ? 'bg-black' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS (45% width desktop) */}
        <div className="w-full lg:w-[45%] flex flex-col px-6 md:px-0 pt-8 lg:pt-0 pb-12">
          
          <h1 className="font-serif text-[28px] md:text-[32px] leading-normal pt-2 mb-3" style={{ color: PALETTE.textPrimary }}>
            {displayTitle}
          </h1>
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="font-sans text-[18px] font-bold" style={{ color: PALETTE.textPrimary }}>{displayPrice}</span>
            <span className="font-sans text-[14px]" style={{ color: PALETTE.textPrimary }}>•</span>
            <span className="font-sans text-[14px]" style={{ color: PALETTE.textPrimary }}>{displaySubtitle}</span>
            <span className="font-sans text-[14px]" style={{ color: PALETTE.textPrimary }}>•</span>
            <Link href="#" className="font-sans text-[12px] hover:underline" style={{ color: PALETTE.gold }}>Learn More</Link>
          </div>
          
          <div className="flex items-center gap-2 mb-8">
            <div className="flex" style={{ color: PALETTE.starGold }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <span className="font-sans text-[14px]" style={{ color: PALETTE.textPrimary }}>4.8 (8 Reviews)</span>
          </div>

          <div className="w-full h-px mb-8" style={{ backgroundColor: PALETTE.divider }} />

          {/* Material Selector */}
          <div className="mb-8">
            <span className="font-sans text-[11px] uppercase tracking-wide block mb-3" style={{ color: PALETTE.textPrimary }}>SELECT MATERIAL:</span>
            <div className="flex gap-4">
              {['White Classic', 'White Velvet'].map(mat => (
                <button
                  suppressHydrationWarning
                  key={mat}
                  onClick={() => setSelectedMaterial(mat)}
                  className="font-sans text-[12px] uppercase tracking-wide px-6 py-3 transition-colors"
                  style={{ 
                    border: `1px solid ${selectedMaterial === mat ? PALETTE.textPrimary : PALETTE.divider}`,
                    backgroundColor: selectedMaterial === mat ? PALETTE.textPrimary : 'transparent',
                    color: selectedMaterial === mat ? PALETTE.buttonText : PALETTE.textSecondary,
                    borderRadius: 0 
                  }}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans text-[11px] uppercase tracking-wide" style={{ color: PALETTE.textPrimary }}>
                COLOR : <span style={{ color: PALETTE.textPrimary }}>{selectedColor.toUpperCase()}</span>
              </span>
              <div className="flex bg-[#F5F5F5] rounded-full overflow-hidden p-[2px] border" style={{ borderColor: PALETTE.divider }}>
                <button 
                  suppressHydrationWarning
                  onClick={() => setColorViewMode('grid')}
                  className="px-5 py-1 rounded-full font-serif text-[12px] transition-colors"
                  style={{ 
                    backgroundColor: colorViewMode === 'grid' ? '#FFFFFF' : 'transparent',
                    border: colorViewMode === 'grid' ? `1px solid ${PALETTE.gold}` : '1px solid transparent',
                    color: PALETTE.textPrimary
                  }}
                >
                  Grid
                </button>
                <button 
                  suppressHydrationWarning
                  onClick={() => setColorViewMode('list')}
                  className="px-5 py-1 rounded-full font-serif text-[12px] transition-colors"
                  style={{ 
                    backgroundColor: colorViewMode === 'list' ? '#FFFFFF' : 'transparent',
                    border: colorViewMode === 'list' ? `1px solid ${PALETTE.gold}` : '1px solid transparent',
                    color: PALETTE.textPrimary
                  }}
                >
                  List
                </button>
              </div>
            </div>

            <div className={`p-6 border ${colorViewMode === 'grid' ? 'flex gap-6 overflow-x-auto pb-6 scrollbar-hide' : 'flex flex-col gap-6'}`} style={{ borderColor: PALETTE.divider, backgroundColor: '#FFFFFF' }}>
              {customColors.map(color => (
                <button
                  suppressHydrationWarning
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={colorViewMode === 'grid' ? 'relative flex-shrink-0 flex flex-col items-center gap-3 group' : 'flex items-center gap-6 group text-left'}
                  title={color.name}
                >
                  <div 
                    className="relative flex items-center justify-center rounded-full transition-all flex-shrink-0"
                    style={{ 
                      width: colorViewMode === 'grid' ? '80px' : '40px', 
                      height: colorViewMode === 'grid' ? '80px' : '40px',
                      border: selectedColor === color.name ? `1px solid ${PALETTE.gold}` : `1px solid transparent`,
                      padding: selectedColor === color.name ? (colorViewMode === 'grid' ? '4px' : '2px') : '0'
                    }}
                  >
                     {/* Simulating the image inside */}
                     <div 
                       className="relative w-full h-full rounded-full overflow-hidden"
                       style={{ backgroundColor: color.hex }}
                     >
                       <Image src="/images/category_bouquets_1782290106325.png" alt={color.name} fill className="object-cover opacity-80" />
                     </div>
                  </div>
                  
                  {colorViewMode === 'grid' ? (
                     <span className="font-serif text-[14px] leading-[1.2] text-center" style={{ color: PALETTE.textPrimary }}>
                       {color.name.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
                     </span>
                  ) : (
                     <span className="font-serif text-[14px]" style={{ color: PALETTE.textPrimary }}>
                       {color.name} <span style={{ color: PALETTE.textSecondary, fontFamily: 'sans-serif', fontSize: '13px' }}>- Purity, Innocence, Freshness.</span>
                     </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Add To Cart */}
          <div className="flex flex-col gap-3 mb-10 border-t pt-8" style={{ borderColor: PALETTE.divider }}>
            <button 
              suppressHydrationWarning
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center font-sans text-[12px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{ 
                backgroundColor: PALETTE.buttonBg, 
                color: PALETTE.buttonText, 
                height: '50px', 
                borderRadius: 0 
              }}
            >
              ADD TO CART
            </button>
            <p className="font-sans text-[11px] text-center" style={{ color: PALETTE.textSecondary }}>
              or 4 interest-free payments of $132.25 USD with <span className="font-bold text-black">Klarna.</span>
            </p>
          </div>

        </div>
      </div>

      {/* MARQUEE BANNER */}
      <div className="w-full py-10 md:py-20 overflow-hidden relative border-t" style={{ backgroundColor: PALETTE.bgPrimary, borderColor: PALETTE.divider }}>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div 
          className="flex whitespace-nowrap"
          style={{ animation: 'marquee 30s linear infinite' }}
        >
          <span className="font-serif italic text-[100px] md:text-[150px] tracking-wide pr-8 leading-none" style={{ color: '#E6DCD1' }}>
            Flowers That Last A Year Or Longer.
          </span>
          <span className="font-serif italic text-[100px] md:text-[150px] tracking-wide pr-8 leading-none" style={{ color: '#E6DCD1' }}>
            Flowers That Last A Year Or Longer.
          </span>
          <span className="font-serif italic text-[100px] md:text-[150px] tracking-wide pr-8 leading-none" style={{ color: '#E6DCD1' }}>
            Flowers That Last A Year Or Longer.
          </span>
          <span className="font-serif italic text-[100px] md:text-[150px] tracking-wide pr-8 leading-none" style={{ color: '#E6DCD1' }}>
            Flowers That Last A Year Or Longer.
          </span>
        </div>
      </div>


      {/* 4.5 SPLIT ACCORDION & VIDEO SECTION */}
      <div className="w-full flex flex-col lg:flex-row border-b" style={{ borderColor: PALETTE.divider }}>
        {/* Left Side: Accordions */}
        <div className="w-full lg:w-[40%] bg-white flex flex-col justify-center py-20 px-8 lg:px-16 xl:px-20">
          <div className="w-full max-w-[600px] mx-auto">
            {[
              { id: 'description', title: 'PRODUCT DESCRIPTION', content: 'Introducing a new expression of our best-selling Eternity® Hydrangeas & Roses arrangement, now for the first time, presented in the exclusive Delft Jardin Bleu hatbox.' },
              { id: 'details', title: 'PRODUCT DETAILS', content: 'Arrangement measures approximately 8" x 8" x 7". Features genuine Eternity Roses that last a year or more. Arrives perfectly arranged in a luxurious display box.' },
              { id: 'care', title: 'PRODUCT CARE', content: 'Do not water. Keep out of direct sunlight and away from high humidity. Dust lightly with a soft brush if needed.' }
            ].map(section => (
              <div key={section.id} className="border-b" style={{ borderColor: PALETTE.divider }}>
                <button 
                  suppressHydrationWarning
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex justify-between items-center py-5 group"
                >
                  <span className="font-sans text-[11px] md:text-[12px] uppercase tracking-[0.15em]" style={{ color: PALETTE.textPrimary }}>
                    {section.title}
                  </span>
                  {/* Custom Plus/Minus animated icon */}
                  <div className="relative w-3 h-3 flex items-center justify-center">
                    <div className="absolute w-full h-[1px] bg-black transition-transform duration-300" />
                    <div className={`absolute h-full w-[1px] bg-black transition-transform duration-300 ${openSection === section.id ? 'rotate-90 opacity-0' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openSection === section.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="font-sans text-[13px] leading-[1.8] pb-8 pt-2" style={{ color: PALETTE.textSecondary }}>
                        {section.content}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        {/* Right Side: Video */}
        <div className="w-full lg:w-[60%] relative aspect-[4/5] lg:aspect-[1.3] overflow-hidden bg-[#F5F0F0]">
           <video 
             ref={videoRef}
             autoPlay 
             loop 
             muted 
             playsInline
             controls={false}
             poster="/images/category_bouquets_1782290106325.png"
             className="absolute inset-0 w-full h-full object-cover pointer-events-none"
             style={{ pointerEvents: 'none' }}
           >
             <source src="https://cdn.pixabay.com/video/2021/08/04/83866-584742616_tiny.mp4" type="video/mp4" />
           </video>
        </div>
      </div>

      {/* 5. THE VENUS EXPERIENCE BANNER */}
      <div className="w-full py-20 px-6" style={{ backgroundColor: PALETTE.experienceBg }}>
        <div className="max-w-[2048px] mx-auto flex flex-col items-center text-center">
          <h2 className="font-serif text-[24px] uppercase tracking-[0.15em] mb-4" style={{ color: PALETTE.textPrimary }}>
            THE VENUS EXPERIENCE
          </h2>
          <p className="font-serif text-[18px] md:text-[20px] italic mb-16" style={{ color: PALETTE.textPrimary }}>
            "Immerse in the luxury of our Eternity® flowers..."
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-4xl">
            <div className="flex flex-col items-center gap-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: PALETTE.textPrimary }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <h3 className="font-serif text-[16px] uppercase tracking-[0.1em]" style={{ color: PALETTE.textPrimary }}>MADE TO ORDER</h3>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: PALETTE.textPrimary }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h3 className="font-serif text-[16px] uppercase tracking-[0.1em]" style={{ color: PALETTE.textPrimary }}>SCHEDULE DELIVERY</h3>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: PALETTE.textPrimary }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <h3 className="font-serif text-[16px] uppercase tracking-[0.1em]" style={{ color: PALETTE.textPrimary }}>VISIT A BOUTIQUE</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 6. YOU MAY ALSO LIKE */}
      <div className="w-full py-20 px-4 md:px-12" style={{ backgroundColor: PALETTE.bgPrimary }}>
        <div className="max-w-[2048px] mx-auto relative">
          <h2 className="font-serif text-[22px] uppercase tracking-[0.15em] text-center mb-12" style={{ color: PALETTE.textPrimary }}>
            YOU MAY ALSO LIKE
          </h2>
          
          <div className="flex gap-4 md:gap-8 overflow-x-auto pb-8 snap-x scrollbar-hide">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-shrink-0 w-[280px] md:w-[300px] snap-center flex flex-col" style={{ backgroundColor: PALETTE.cardBg }}>
                <div className="relative w-full aspect-[4/5] bg-gray-100 mb-4">
                  <Image src="/images/category_bouquets_1782290106325.png" alt="Related" fill className="object-cover" />
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-[16px]" style={{ color: PALETTE.textPrimary }}>Eternity Roses Box</h3>
                    <span className="font-sans text-[14px] font-bold" style={{ color: PALETTE.textPrimary }}>$299</span>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: PALETTE.starGold }}>
                    <Star size={12} fill="currentColor" strokeWidth={0} />
                    <Star size={12} fill="currentColor" strokeWidth={0} />
                    <Star size={12} fill="currentColor" strokeWidth={0} />
                    <Star size={12} fill="currentColor" strokeWidth={0} />
                    <Star size={12} fill="currentColor" strokeWidth={0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop Navigation Arrows */}
          <button suppressHydrationWarning className="hidden md:flex absolute top-1/2 left-0 -translate-y-1/2 w-12 h-12 bg-white/80 border items-center justify-center hover:bg-white" style={{ borderColor: PALETTE.divider }}>
            <ChevronLeft size={20} />
          </button>
          <button suppressHydrationWarning className="hidden md:flex absolute top-1/2 right-0 -translate-y-1/2 w-12 h-12 bg-white/80 border items-center justify-center hover:bg-white" style={{ borderColor: PALETTE.divider }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 7. REVIEWS SECTION */}
      <div className="w-full py-24 px-4 md:px-12 border-t" style={{ backgroundColor: PALETTE.bgPrimary, borderColor: PALETTE.divider }}>
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-serif text-[22px] uppercase tracking-[0.15em] text-center mb-8" style={{ color: PALETTE.textPrimary }}>
            REVIEWS
          </h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 pb-6 border-b" style={{ borderColor: PALETTE.divider }}>
            <div className="flex items-center gap-4">
              <span className="font-sans text-[24px] font-bold" style={{ color: PALETTE.textPrimary }}>5.0</span>
              <div className="flex" style={{ color: PALETTE.starGold }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" strokeWidth={0} />)}
              </div>
              <span className="font-sans text-[14px] uppercase tracking-wide" style={{ color: PALETTE.textPrimary }}>BASED ON 8 REVIEWS</span>
            </div>
            
            <div className="flex gap-4">
              <button suppressHydrationWarning className="font-sans text-[12px] uppercase tracking-widest border px-6 py-2 flex items-center gap-2" style={{ borderColor: PALETTE.textPrimary }}>
                FILTERS
              </button>
              <button suppressHydrationWarning className="font-sans text-[12px] uppercase tracking-widest border px-6 py-2 flex items-center gap-2" style={{ borderColor: PALETTE.textPrimary }}>
                MOST RECENT <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-10">
            {[
              { name: 'Sarah M.', date: '2 weeks ago', text: 'The coastal blue color is absolutely breathtaking. This arrangement elevated my entire living room. Worth every penny for the luxury feel and longevity.' },
              { name: 'Jessica R.', date: '3 months ago', text: 'Received as a birthday gift and I am in awe. The packaging was immaculate and the flowers smell so fresh even after a month. Perfect.' },
              { name: 'Elena V.', date: '4 months ago', text: 'I have bought three of these boxes now for different rooms. The quality is unmatched. Customer service was also very helpful when I needed to change my delivery date.', reply: 'Dear Elena, thank you so much for your continued support! We are thrilled to hear that our arrangements have found a place in your beautiful home. - Venus et Fleur Team' }
            ].map((rev, i) => (
              <div key={i} className="flex flex-col gap-3 pb-10 border-b last:border-0" style={{ borderColor: PALETTE.divider }}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="flex" style={{ color: PALETTE.starGold }}>
                      {[...Array(5)].map((_, idx) => <Star key={idx} size={14} fill="currentColor" strokeWidth={0} />)}
                    </div>
                    <span className="font-sans text-[14px] font-bold" style={{ color: PALETTE.textPrimary }}>{rev.name}</span>
                    <span className="font-sans text-[11px] flex items-center gap-1" style={{ color: PALETTE.textSecondary }}>
                      <Check size={12} /> VERIFIED BUYER
                    </span>
                  </div>
                  <span className="font-sans text-[11px]" style={{ color: PALETTE.textSecondary }}>{rev.date}</span>
                </div>
                
                <p className="font-sans text-[14px] leading-[1.6]" style={{ color: PALETTE.textPrimary }}>
                  {rev.text}
                </p>
                <Link href="#" className="font-sans text-[12px] hover:underline" style={{ color: PALETTE.gold }}>Read More</Link>
                
                {rev.reply && (
                  <div className="mt-4 pl-4 border-l-2" style={{ borderColor: PALETTE.divider }}>
                    <span className="font-sans text-[12px] font-bold block mb-1" style={{ color: PALETTE.textPrimary }}>Venus et Fleur</span>
                    <p className="font-sans text-[14px] leading-[1.6]" style={{ color: PALETTE.textSecondary }}>
                      {rev.reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
      
    </div>
  )
}
