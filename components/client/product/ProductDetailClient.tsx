"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ChevronRight, Minus, Plus, ChevronDown, Check, ChevronLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/context/AppContext'

// Define the colors from the user prompt
const PALETTE = {
  bgPrimary: '#FDFBF9', // Lighter elegant background
  textPrimary: '#000000',
  textSecondary: '#8A8A8A',
  breadcrumb: '#9A9A9A',
  gold: '#C4A882',
  starGold: '#D4A843',
  buttonBg: '#8B0000',
  buttonText: '#FFFFFF',
  experienceBg: '#EAE1D8', // Light beige for experience section
  footerBg: '#F4F0EC',
  cardBg: '#FEFEFE',
  divider: '#EBEBEB'
}

// Mock Data for UI completeness based on screenshot
const MOCK_REVIEWS = [
  { id: 1, name: 'M.E.', rating: 5, date: 'Yesterday', title: 'Love it!', content: 'Absolutely gorgeous arrangement, and smells amazing even days later. Highly recommend!' },
  { id: 2, name: 'Sarah L.', rating: 5, date: 'Tuesday', title: 'Perfect gift', content: 'Bought this for my mom and she was thrilled. The quality is unmatched and packaging is beautiful.' },
  { id: 3, name: 'Jessica T.', rating: 5, date: '2 days ago', title: 'Stunning', content: 'These look beautiful on my entryway table.' }
];

const MOCK_RECOMMENDATIONS = [
  { id: '1', name: 'Le Mini Square', price: 99, image: '/images/category_bouquets_1782290106325.png', colors: ['#FFB6C1', '#FFF'] },
  { id: '2', name: 'Classic Round', price: 299, image: '/images/category_bouquets_1782290106325.png', colors: ['#FFF', '#FF0000', '#FF69B4'] },
  { id: '3', name: 'Grand Square', price: 399, image: '/images/category_bouquets_1782290106325.png', colors: ['#800080', '#FFF'] },
];

export default function ProductDetailClient({ product }: { product: any }) {
  const { addToCart, setCartOpen } = useApp()

  // Default states based on the first variant if available
  const defaultVariant = product.variants?.[0]
  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVariant?.id || '')
  const [selectedSize, setSelectedSize] = useState<string>('Small')
  const [colorView, setColorView] = useState<'Grid' | 'List'>('Grid')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [openSection, setOpenSection] = useState<string | null>('description')

  const selectedVariant = product.variants?.find((v: any) => v.id === selectedVariantId) || defaultVariant

  const allImages = selectedVariant?.images?.length > 0
    ? selectedVariant.images
    : (selectedVariant?.hoverImage ? [{ url: selectedVariant.hoverImage }] : (defaultVariant?.images?.length > 0 ? defaultVariant.images : [{ url: '/images/category_bouquets_1782290106325.png' }]))

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

  const handleAddToCart = () => {
    if (!selectedVariant) return
    addToCart({
      product: { slug: product.slug, name: product.name, price: Number(selectedVariant.salePrice || selectedVariant.price) },
      quantity,
      roseColor: selectedVariant.color || 'Default',
      boxColor: selectedVariant.material || 'Standard',
      boxShape: selectedSize,
      price: Number(selectedVariant.salePrice || selectedVariant.price)
    })
    setCartOpen(true)
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  const displayTitle = selectedVariant?.variantName || product.name
  const displaySubtitle = product.category?.name || "Premium Collection"
  const price = Number(selectedVariant?.price || 299)
  const salePrice = Number(selectedVariant?.salePrice || 0)
  const isSale = salePrice > 0 && salePrice < price

  return (
    <div style={{ backgroundColor: PALETTE.bgPrimary }} className="min-h-screen pb-0 font-sans">

      {/* BREADCRUMB */}
      <div className="max-w-[2048px] mx-auto px-4 md:px-12 py-4">
        <nav className="flex items-center text-[10px] uppercase tracking-widest" style={{ color: PALETTE.breadcrumb }}>
          <Link href="/" className="hover:text-black transition-colors">HOME</Link>
          <span className="mx-3">/</span>
          <Link href="/shop" className="hover:text-black transition-colors">SHOP</Link>
          <span className="mx-3">/</span>
          <span className="text-black truncate">{product.name}</span>
        </nav>
      </div>

      {/* PRODUCT TWO-COLUMN LAYOUT */}
      <div className="max-w-[1440px] mx-auto px-0 md:px-12 pb-16 lg:pb-24 flex flex-col lg:flex-row gap-0 lg:gap-16 pt-32 lg:pt-40">

        {/* LEFT COLUMN: IMAGES */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4 relative pr-0 lg:pr-8">
          <div className="w-full flex items-center gap-4 lg:gap-6">
            <div className="relative flex-grow w-full aspect-[4/5] bg-[#FAFAFA] overflow-hidden group rounded-sm">
              <AnimatePresence initial={false}>
                <motion.div
                  key={`${selectedVariantId}-${activeImage}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={allImages[activeImage]?.url || '/images/category_bouquets_1782290106325.png'}
                    alt={displayTitle}
                    fill
                    priority
                    className="object-contain lg:object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Vertical Dots Navigation - Desktop (Moved to Right Side) */}
            {allImages.length > 1 && (
              <div className="hidden lg:flex flex-col items-center gap-4 flex-shrink-0 z-10 pr-4">
                <button
                  onClick={() => setActiveImage(prev => (prev - 1 + allImages.length) % allImages.length)}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors bg-white"
                  style={{ borderColor: PALETTE.divider, color: PALETTE.textSecondary }}
                >
                  <ArrowUp size={14} strokeWidth={1.5} />
                </button>

                <div className="flex flex-col gap-3 py-2">
                  {allImages.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className="w-[6px] h-[6px] rounded-full transition-colors"
                      style={{ backgroundColor: activeImage === idx ? PALETTE.textPrimary : '#D5D5D5' }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setActiveImage(prev => (prev + 1) % allImages.length)}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors bg-white"
                  style={{ borderColor: PALETTE.divider, color: PALETTE.textPrimary }}
                >
                  <ArrowDown size={14} strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* Dots for mobile */}
            <div className="flex lg:hidden absolute bottom-6 left-0 right-0 justify-center gap-2 px-4 z-10">
              {allImages.map((_: any, idx: number) => (
                <div key={idx} className={`w-[6px] h-[6px] rounded-full transition-colors ${activeImage === idx ? 'bg-black' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS */}
        <div className="w-full lg:w-[40%] flex flex-col px-6 md:px-0 pt-8 lg:pt-0 pb-12">

          <h1 className="font-serif text-[26px] md:text-[34px] leading-tight mb-2 tracking-wide uppercase" style={{ color: PALETTE.textPrimary }}>
            {displayTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-serif text-[18px]" style={{ color: PALETTE.textPrimary }}>
              {isSale ? (
                <>
                  <span className="line-through text-gray-400 mr-2">QAR {price.toFixed(2)}</span>
                  <span className="text-red-600">QAR {salePrice.toFixed(2)}</span>
                </>
              ) : (
                <>QAR {price.toFixed(2)}</>
              )}
            </span>
            <span className="font-sans text-[14px] text-gray-400 mx-1">·</span>
            <span className="font-sans text-[12px] tracking-widest uppercase" style={{ color: PALETTE.textPrimary }}>{displaySubtitle}</span>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-[2px]" style={{ color: PALETTE.starGold }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <span className="font-sans text-[13px] cursor-pointer transition-colors" style={{ color: PALETTE.textPrimary }}>
              4.8 (8 Reviews)
            </span>
          </div>

          <div className="w-full h-px mb-8" style={{ backgroundColor: PALETTE.divider }} />

          {/* Arrangement Size Selector */}
          <div className="mb-8">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-widest mb-4 block" style={{ color: PALETTE.textPrimary }}>
              <span style={{ color: PALETTE.textSecondary }}>FLORAL : </span>
              {selectedSize === 'Mini' ? 'PEONY POÉSIE' : selectedSize === 'Small' ? 'PEONIES' : 'PEONY ÉTOILE'}
            </span>
            <div className="border border-[#EBEBEB] p-6 flex flex-wrap gap-8 items-start">
              {['Mini', 'Small', 'Large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div
                    className="relative w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all"
                    style={{
                      border: selectedSize === size ? `1px solid ${PALETTE.gold}` : `1px solid transparent`
                    }}
                  >
                    <div className="relative w-[60px] h-[60px] rounded-full overflow-hidden">
                      <Image
                        src="/images/category_bouquets_1782290106325.png"
                        alt={size}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  <span className="font-serif text-[12px] tracking-[0.05em]" style={{ color: PALETTE.textPrimary }}>
                    {size === 'Mini' ? 'Peony Poésie' : size === 'Small' ? 'Peonies' : 'Peony Étoile'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px mb-8" style={{ backgroundColor: PALETTE.divider }} />

          {/* Color Selector */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-widest block" style={{ color: PALETTE.textPrimary }}>
                <span style={{ color: PALETTE.textSecondary }}>COLOR : </span>
                {selectedVariant?.color || 'CRÈME CHANTILLY'}
              </span>
              
              <div className="flex bg-[#FAFAFA] rounded-full p-[2px]">
                <button 
                  onClick={() => setColorView('Grid')}
                  className="px-4 py-1 rounded-full font-serif text-[11px] transition-all"
                  style={{
                    backgroundColor: colorView === 'Grid' ? '#FFFFFF' : 'transparent',
                    border: colorView === 'Grid' ? `1px solid ${PALETTE.gold}` : '1px solid transparent',
                    color: PALETTE.textPrimary
                  }}
                >
                  Grid
                </button>
                <button 
                  onClick={() => setColorView('List')}
                  className="px-4 py-1 rounded-full font-serif text-[11px] transition-all"
                  style={{
                    backgroundColor: colorView === 'List' ? '#FFFFFF' : 'transparent',
                    border: colorView === 'List' ? `1px solid ${PALETTE.gold}` : '1px solid transparent',
                    color: PALETTE.textPrimary
                  }}
                >
                  List
                </button>
              </div>
            </div>

            <div className={`border border-[#EBEBEB] p-6 flex ${colorView === 'Grid' ? 'flex-wrap gap-8 items-start' : 'flex-col gap-4'}`}>
              {product.variants?.map((v: any) => {
                // Helper to render a fallback color based on name
                const getFallbackColor = (name: string) => {
                  if (!name) return '#CCCCCC';
                  const lower = name.toLowerCase();
                  if (lower.includes('red')) return '#900000';
                  if (lower.includes('white')) return '#F8F8F8';
                  if (lower.includes('pink')) return '#FFB6C1';
                  if (lower.includes('blue')) return '#000080';
                  if (lower.includes('black')) return '#1A1A1A';
                  if (lower.includes('purple')) return '#4B0082';
                  if (lower.includes('yellow')) return '#FFD700';
                  return '#CCCCCC';
                };

                const getColorImage = (name: string) => {
                  if (!name) return null;
                  const lower = name.toLowerCase();
                  if (lower.includes('red')) return '/images/red rosses.png';
                  if (lower.includes('white')) return '/images/rosses.png';
                  if (lower.includes('pink')) return '/images/lillies.png';
                  return null;
                };

                const displayColor = v.colorCode || getFallbackColor(v.color);
                const imageUrl = v.swatchImage || v.hoverImage || v.images?.[0]?.url || getColorImage(v.color);

                return (
                  <div key={v.id} className={`${colorView === 'Grid' ? 'flex flex-col items-center' : 'w-full'}`}>
                    <button
                      onClick={() => {
                        setSelectedVariantId(v.id)
                        setActiveImage(0)
                      }}
                      className={`group flex ${colorView === 'Grid' ? 'flex-col items-center gap-3 w-16' : 'items-center gap-4 w-full'}`}
                      title={v.color}
                    >
                      <div
                        className="relative w-[70px] h-[70px] flex items-center justify-center rounded-full transition-all flex-shrink-0"
                        style={{
                          border: selectedVariantId === v.id ? `1px solid ${PALETTE.gold}` : `1px solid transparent`
                        }}
                      >
                        <div
                          className="relative w-[60px] h-[60px] rounded-full overflow-hidden border border-gray-200"
                          style={{ backgroundColor: displayColor }}
                        >
                          {imageUrl && <Image src={imageUrl} alt={v.color || 'Color swatch'} fill className="object-cover" />}
                        </div>
                      </div>

                      <span className={`font-serif text-[12px] leading-tight tracking-[0.05em] capitalize ${colorView === 'Grid' ? 'text-center' : 'text-left'}`} style={{ color: PALETTE.textPrimary }}>
                        {(v.color || 'Soft Pink')}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add To Cart */}
          <div className="flex flex-col gap-4 mt-8">
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center font-sans text-[12px] font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-85"
              style={{
                backgroundColor: PALETTE.buttonBg,
                color: PALETTE.buttonText,
                height: '56px',
                borderRadius: '0'
              }}
            >
              ADD TO CART
            </button>
            <div className="flex items-center justify-center gap-1 font-sans text-[12px]" style={{ color: PALETTE.textSecondary }}>
              <span>or 4 interest-free payments of QAR {(price / 4).toFixed(2)} with</span>
              <span className="font-bold text-black tracking-tighter">Klarna.</span>
              <Link href="#" className="underline ml-1 hover:text-black">Learn More</Link>
            </div>
          </div>

        </div>
      </div>

      {/* MARQUEE BANNER */}
      <div className="w-full py-12 md:py-24 overflow-hidden relative bg-[#FDFBF9]">
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div
          className="flex whitespace-nowrap opacity-40"
          style={{ animation: 'marquee 40s linear infinite' }}
        >
          {[...Array(4)].map((_, i) => (
            <span key={i} className="font-serif italic text-[80px] md:text-[140px] tracking-normal pr-12 leading-none" style={{ color: '#D4C8B8' }}>
              Year Or Longer. Flowers That Last.
            </span>
          ))}
        </div>
      </div>

      {/* SPLIT ACCORDION & IMAGE SECTION */}
      <div id="details" className="w-full flex flex-col-reverse lg:flex-row max-w-[2048px] mx-auto border-t border-b" style={{ borderColor: PALETTE.divider }}>
        {/* Left Side: Accordions */}
        <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center py-16 px-6 lg:px-16 xl:px-24">
          <div className="w-full max-w-[500px]">
            <h2 className="font-serif text-[24px] tracking-widest uppercase mb-10" style={{ color: PALETTE.textPrimary }}>Product Information</h2>
            {[
              { id: 'description', title: 'PRODUCT DESCRIPTION', content: selectedVariant?.description || 'Classic and elegant, our Porcelain Vase arrangements bring a touch of sophistication to any space. Hand-arranged with precision, these Eternity® Roses require no water and can last up to a year or more with proper care. The ceramic vase features a smooth matte finish, elevating the presentation of our immaculate blooms.' },
              { id: 'details', title: 'PRODUCT DETAILS', content: selectedVariant?.details || 'Dimensions: 6" W x 6.5" H. Includes 16-20 premium Eternity Roses. Handcrafted porcelain vessel.' },
              { id: 'care', title: 'PRODUCT CARE', content: selectedVariant?.productCare || 'Do not water. Keep out of direct sunlight and high humidity. Gentle dusting only.' }
            ].map(section => (
              <div key={section.id} className="border-b" style={{ borderColor: PALETTE.divider }}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex justify-between items-center py-6 group"
                >
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: PALETTE.textPrimary }}>
                    {section.title}
                  </span>
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <Plus size={16} className={`absolute transition-transform duration-300 ${openSection === section.id ? 'rotate-90 opacity-0' : 'opacity-100'}`} strokeWidth={1} />
                    <Minus size={16} className={`absolute transition-transform duration-300 ${openSection === section.id ? 'opacity-100' : 'rotate-90 opacity-0'}`} strokeWidth={1} />
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
                      <p className="font-serif text-[15px] leading-[1.8] pb-8 text-gray-600">
                        {section.content}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        {/* Right Side: Static Image */}
        <div className="w-full lg:w-[55%] relative h-[50vh] lg:h-auto min-h-[500px]">
          <Image
            src="/images/category_bouquets_1782290106325.png" // Fallback, replace with actual landscape image 
            alt="Vase lifestyle image"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* THE VENUS EXPERIENCE BANNER */}
      <div className="w-full py-24 px-6" style={{ backgroundColor: PALETTE.experienceBg }}>
        <div className="max-w-[1200px] mx-auto flex flex-col items-center text-center">
          <h2 className="font-serif text-[28px] uppercase tracking-[0.2em] mb-4" style={{ color: PALETTE.textPrimary }}>
            THE VENUS EXPERIENCE
          </h2>
          <p className="font-serif text-[18px] italic mb-20 text-gray-800">
            "Immerse in the luxury of our Eternity® flowers..."
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 w-full">
            {/* Experience Icon 1 */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-gray-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.2em]">MADE TO ORDER</h3>
              <p className="font-serif text-[14px] text-gray-600 max-w-[250px]">Each arrangement is crafted uniquely for you by our floral design experts.</p>
            </div>

            {/* Experience Icon 2 */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-gray-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.2em]">SCHEDULE DELIVERY</h3>
              <p className="font-serif text-[14px] text-gray-600 max-w-[250px]">Select your preferred delivery date at checkout for perfectly timed gifting.</p>
            </div>

            {/* Experience Icon 3 */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-gray-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.2em]">VISIT A BOUTIQUE</h3>
              <p className="font-serif text-[14px] text-gray-600 max-w-[250px]">Experience our exquisite arrangements in person at our retail locations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* YOU MAY ALSO LIKE SECTION */}
      <div className="w-full py-20 px-6 bg-white border-b" style={{ borderColor: PALETTE.divider }}>
        <div className="max-w-[1440px] mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-serif text-[24px] uppercase tracking-widest">YOU MAY ALSO LIKE</h2>
            <div className="hidden md:flex gap-4">
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><ChevronLeft size={16} /></button>
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 overflow-x-auto pb-4 scrollbar-hide">
            {MOCK_RECOMMENDATIONS.map((item) => (
              <Link href="#" key={item.id} className="flex flex-col group min-w-[160px]">
                <div className="relative aspect-[4/5] bg-[#F5F5F5] mb-4 overflow-hidden">
                  <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 className="font-serif text-[14px] mb-1">{item.name}</h3>
                <span className="font-serif text-[14px] text-gray-600 mb-3">QAR {item.price}</span>
                <div className="flex gap-1">
                  {item.colors.map((c, i) => (
                    <div key={i} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="w-full py-24 px-6 bg-white">
        <div className="max-w-[1000px] mx-auto flex flex-col items-center">
          <h2 className="font-serif text-[40px] uppercase tracking-widest mb-4 text-gray-200 font-light">REVIEWS</h2>
          <div className="flex items-center gap-3 mb-2 font-serif text-[24px]">
            <span className="font-serif">5.0</span>
            <div className="flex text-[#D4A843]">
              {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" strokeWidth={0} />)}
            </div>
          </div>
          <p className="font-sans text-[10px] uppercase font-bold tracking-widest text-black mb-16">Based on 4 reviews</p>

          <div className="w-full flex flex-col mb-12">
            {/* Filter Header */}
            <div className={`w-full flex ${filtersOpen ? 'flex-col items-start gap-8' : 'flex-row justify-between items-center'} pb-4 border-b border-gray-200`}>
              
              <button 
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-2 font-sans text-[11px] font-bold tracking-[0.1em] uppercase text-gray-700 hover:text-black transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="18" x2="12" y2="18"></line></svg>
                FILTERS
              </button>

              {filtersOpen && (
                <div className="flex flex-col gap-4 w-full">
                  <span className="font-serif text-[18px] font-bold text-black">Rating</span>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-5 py-2 rounded-full border border-gray-200 flex items-center justify-center hover:border-black transition-colors">
                      <Star size={12} fill="black" strokeWidth={0} />
                    </button>
                    <button className="px-5 py-2 rounded-full border border-gray-200 flex items-center justify-center gap-1 hover:border-black transition-colors">
                      {[...Array(2)].map((_, i) => <Star key={i} size={12} fill="black" strokeWidth={0} />)}
                    </button>
                    <button className="px-5 py-2 rounded-full border border-gray-200 flex items-center justify-center gap-1 hover:border-black transition-colors">
                      {[...Array(3)].map((_, i) => <Star key={i} size={12} fill="black" strokeWidth={0} />)}
                    </button>
                    <button className="px-5 py-2 rounded-full border border-gray-200 flex items-center justify-center gap-1 hover:border-black transition-colors">
                      {[...Array(4)].map((_, i) => <Star key={i} size={12} fill="black" strokeWidth={0} />)}
                    </button>
                    <button className="px-5 py-2 rounded-full border border-gray-200 flex items-center justify-center gap-1 hover:border-black transition-colors">
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="black" strokeWidth={0} />)}
                    </button>
                  </div>
                </div>
              )}

              <div className={`flex items-center gap-2 font-sans text-[10px] uppercase font-bold tracking-widest cursor-pointer border-b border-black pb-1 ${filtersOpen ? 'self-end mt-4' : ''}`}>
                MOST RECENT <ChevronDown size={14} />
              </div>

            </div>
          </div>

          <div className="w-full flex flex-col">
            {MOCK_REVIEWS.map((review) => (
              <div key={review.id} className="w-full flex flex-col md:flex-row py-8 border-b border-gray-100">
                {/* Left Column: Name */}
                <div className="w-full md:w-1/4 flex-shrink-0 mb-4 md:mb-0">
                  <h4 className="font-serif text-[15px] text-black">{review.name}</h4>
                </div>

                {/* Middle Column: Content */}
                <div className="w-full md:w-2/4 flex flex-col">
                  <div className="flex text-[#D4A843] mb-4">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" strokeWidth={0} />)}
                  </div>
                  
                  <h4 className="font-serif text-[14px] text-gray-800 mb-3">{review.title}</h4>
                  <p className="font-serif text-[14px] text-gray-800 leading-relaxed">{review.content}</p>
                </div>

                {/* Right Column: Date */}
                <div className="w-full md:w-1/4 flex justify-start md:justify-end mt-4 md:mt-0">
                  <span className="font-serif text-[13px] text-black">3 months ago</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  )
}

