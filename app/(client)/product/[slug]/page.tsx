'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ChevronRight, Minus, Plus, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { PRODUCTS } from '../../../../data/products'
import { useApp } from '../../../../context/AppContext'
import dynamic from 'next/dynamic'
const YouMayAlsoLike = dynamic(() => import('../../../../components/YouMayAlsoLike'))

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  
  const product = PRODUCTS.find(p => p.slug === slug)
  const { addToCart, setCartOpen } = useApp()
  
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0]?.name || 'Classic Red')
  const [selectedBox, setSelectedBox] = useState(product?.boxColors?.[0]?.name || 'Matte Black')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  
  // Accordion states
  const [openSection, setOpenSection] = useState<string | null>('description')

  // Derive images array (fallback to main image if none provided)
  const allImages = product?.images && product.images.length > 0 ? product.images : [product?.image || '']
  const maxThumbnails = allImages.slice(0, 3)

  // Keyboard navigation for gallery
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

  if (!product) {
    return notFound()
  }

  const handleAddToCart = () => {
    addToCart({
      product: {
        slug: product.slug,
        name: product.name,
        price: product.price,
      },
      quantity,
      roseColor: selectedColor,
      boxColor: selectedBox,
      boxShape: product.boxShape,
      price: product.price
    })
    setCartOpen(true)
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  const fadeVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }
  }

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -10000) {
      setActiveImage((prev) => (prev + 1) % allImages.length);
    } else if (swipe > 10000) {
      setActiveImage((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  return (
    <div className="bg-white min-h-screen pt-24 md:pt-32 pb-24 lg:pb-0">
      {/* Breadcrumbs */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-8">
        <nav className="flex items-center text-[10px] uppercase tracking-widest text-muted font-sans">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} className="mx-2" />
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <ChevronRight size={12} className="mx-2" />
          <Link href={`/collections/${product.collection}`} className="hover:text-primary transition-colors">
            {product.collection.replace('-', ' ')}
          </Link>
          <ChevronRight size={12} className="mx-2" />
          <span className="text-primary truncate">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pb-16 lg:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
        
        {/* Left: Premium Image Gallery (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Main Image with AnimatePresence */}
          <div className="relative w-full aspect-square bg-[#F9F9F9] overflow-hidden rounded-none touch-pan-y">
            <AnimatePresence initial={false}>
              <motion.div
                key={activeImage}
                variants={fadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
              >
                <Image 
                  src={allImages[activeImage]} 
                  alt={`${product.name} view ${activeImage + 1}`} 
                  fill 
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              </motion.div>
            </AnimatePresence>
            
            {/* Gallery indicators for mobile/swipe */}
            {allImages.length > 1 && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10 lg:hidden">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    suppressHydrationWarning
                    onClick={() => setActiveImage(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeImage === idx ? 'bg-primary w-4' : 'bg-black/20 hover:bg-black/40'}`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails (Max 3) */}
          {allImages.length > 1 && (
            <div className="hidden lg:flex gap-4">
              {maxThumbnails.map((img, idx) => (
                <button 
                  key={idx}
                  suppressHydrationWarning
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-24 h-24 flex-shrink-0 border transition-all duration-500 overflow-hidden ${activeImage === idx ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-100 hover:border-divider'}`}
                >
                  <Image src={img} alt={`${product.name} thumbnail ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
              {allImages.length > 3 && (
                <button 
                  suppressHydrationWarning
                  onClick={() => setActiveImage(3)}
                  className={`relative w-24 h-24 flex-shrink-0 border transition-all duration-500 overflow-hidden flex items-center justify-center bg-[#F9F9F9] ${activeImage >= 3 ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-100 hover:border-divider'}`}
                >
                  <span className="font-sans text-xs uppercase tracking-widest text-primary font-medium">+{allImages.length - 3} More</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Sticky Product Details (5 columns) */}
        <div className="lg:col-span-5 lg:col-start-7 relative">
          <div className="sticky top-32 flex flex-col">
            <h1 className="font-serif text-3xl md:text-5xl text-primary mb-3">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex text-secondary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.floor(product.rating || 5) ? "currentColor" : "none"} strokeWidth={i < Math.floor(product.rating || 5) ? 0 : 1} />
                ))}
              </div>
              <span className="text-xs font-sans uppercase tracking-[0.15em] text-muted">
                {product.reviewCount || 0} Reviews
              </span>
            </div>

            <p className="font-sans text-2xl text-primary mb-8">
              ${product.price}
            </p>

            <p className="font-sans text-sm text-secondary/80 leading-relaxed mb-10">
              {product.description}
            </p>

            {/* Color Selectors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-sans text-[11px] uppercase tracking-[0.2em] font-semibold text-primary">Rose Color</span>
                  <span className="font-sans text-[11px] uppercase tracking-widest text-muted">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {product.colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      suppressHydrationWarning
                      className={`w-10 h-10 rounded-full border border-black/10 transition-all duration-300 flex items-center justify-center ${selectedColor === color.name ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.boxColors && product.boxColors.length > 0 && (
              <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-sans text-[11px] uppercase tracking-[0.2em] font-semibold text-primary">Box Color</span>
                  <span className="font-sans text-[11px] uppercase tracking-widest text-muted">{selectedBox}</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {product.boxColors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedBox(color.name)}
                      suppressHydrationWarning
                      className={`w-10 h-10 rounded-full border border-black/10 transition-all duration-300 flex items-center justify-center ${selectedBox === color.name ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sticky Mobile Add to Cart & Desktop Add to Cart */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-divider p-4 lg:relative lg:border-none lg:p-0 lg:z-0 lg:bg-transparent shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:shadow-none pb-safe">
              <div className="max-w-[1400px] mx-auto flex gap-4">
                <div className="hidden sm:flex items-center justify-between border border-primary w-32 px-4 h-[52px]">
                  <button suppressHydrationWarning onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-primary p-2 -ml-2 hover:opacity-70 transition-opacity"><Minus size={16} /></button>
                  <span className="font-sans text-sm font-medium">{quantity}</span>
                  <button suppressHydrationWarning onClick={() => setQuantity(quantity + 1)} className="text-primary p-2 -mr-2 hover:opacity-70 transition-opacity"><Plus size={16} /></button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  suppressHydrationWarning
                  className="flex-grow bg-primary text-white font-sans text-[11px] md:text-xs uppercase tracking-[0.2em] hover:bg-secondary transition-colors duration-500 h-[52px] flex items-center justify-center font-medium"
                >
                  Add To Cart - ${(product.price * quantity).toLocaleString()}
                </button>
              </div>
            </div>

            {/* Accordions */}
            <div className="border-t border-divider mt-12 lg:mt-0">
              {/* Dimensions */}
              {product.dimensions && (
                <div className="border-b border-divider">
                  <button 
                    onClick={() => toggleSection('dimensions')}
                    suppressHydrationWarning
                    className="w-full flex justify-between items-center py-6 focus:outline-none group"
                  >
                    <span className="font-sans text-[11px] uppercase tracking-[0.2em] font-semibold text-primary group-hover:text-secondary transition-colors">Dimensions</span>
                    <motion.div animate={{ rotate: openSection === 'dimensions' ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown size={16} className="text-muted" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openSection === 'dimensions' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="font-sans text-sm text-secondary/70 pb-6 leading-relaxed">{product.dimensions}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Materials */}
              {product.materials && (
                <div className="border-b border-divider">
                  <button 
                    onClick={() => toggleSection('materials')}
                    suppressHydrationWarning
                    className="w-full flex justify-between items-center py-6 focus:outline-none group"
                  >
                    <span className="font-sans text-[11px] uppercase tracking-[0.2em] font-semibold text-primary group-hover:text-secondary transition-colors">Materials</span>
                    <motion.div animate={{ rotate: openSection === 'materials' ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown size={16} className="text-muted" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openSection === 'materials' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="font-sans text-sm text-secondary/70 pb-6 leading-relaxed">{product.materials}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Care */}
              {product.care && product.care.length > 0 && (
                <div className="border-b border-divider">
                  <button 
                    onClick={() => toggleSection('care')}
                    suppressHydrationWarning
                    className="w-full flex justify-between items-center py-6 focus:outline-none group"
                  >
                    <span className="font-sans text-[11px] uppercase tracking-[0.2em] font-semibold text-primary group-hover:text-secondary transition-colors">Care Instructions</span>
                    <motion.div animate={{ rotate: openSection === 'care' ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown size={16} className="text-muted" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openSection === 'care' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <ul className="list-disc list-inside font-sans text-sm text-secondary/70 space-y-3 pb-6 leading-relaxed">
                          {product.care.map((instruction, idx) => (
                            <li key={idx} className="pl-2">{instruction}</li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Related Products */}
      <YouMayAlsoLike currentProductId={product.id} collection={product.collection} />
    </div>
  )
}
