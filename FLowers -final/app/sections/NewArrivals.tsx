'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '../../components/AnimatedSection'

interface Product {
  id: string;
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
  return (
    <AnimatedSection className="py-24 bg-[#FFF6F0]">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-light">
              NEW ARRIVALS
            </h2>
            <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted mt-4">
              THE LATEST IN LUXURY GIFTING
            </p>
          </div>
          <Link href="/shop" className="hidden md:block font-sans text-[11px] uppercase tracking-[0.15em] text-primary hover:text-secondary transition-colors border-b border-primary pb-1">
            VIEW ALL
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="luxury-card group flex flex-col h-full bg-white relative">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream/20">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                />
                <Image
                  src={product.hoverImage}
                  alt={`${product.name} alternate view`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 scale-105"
                />
                {product.badge && (
                  <div className="absolute top-4 left-4 bg-secondary text-white text-[9px] uppercase tracking-widest px-3 py-1 font-semibold z-10">
                    {product.badge}
                  </div>
                )}
                <button className="absolute top-4 right-4 text-primary hover:text-accent transition-colors z-10" aria-label="Add to wishlist" suppressHydrationWarning>
                  <Heart size={20} />
                </button>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-lg text-primary">{product.name}</h3>
                  <span className="font-sans text-sm text-primary font-medium">${product.price}</span>
                </div>
                <p className="font-sans text-[10px] uppercase tracking-widest text-muted mb-4">{product.subtitle}</p>
                
                <div className="mt-auto pt-4 border-t border-divider flex justify-between items-center">
                  <div className="flex gap-2">
                    {product.swatches.map((color, idx) => (
                      <div 
                        key={idx}
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
          ))}
        </div>
        
        <div className="mt-12 text-center md:hidden">
          <Link href="/shop" className="btn-primary inline-block px-8 py-4 w-full">
            VIEW ALL ARRIVALS
          </Link>
        </div>
      </div>
    </AnimatedSection>
  )
}
