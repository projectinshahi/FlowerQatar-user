'use client'
import React, { useMemo } from 'react'
import { Product } from '../types'
import { PRODUCTS } from '../data/products'
import ProductCard from './ProductCard'

interface YouMayAlsoLikeProps {
  currentProductId: string
  collection: string
}

export default function YouMayAlsoLike({ currentProductId, collection }: YouMayAlsoLikeProps) {
  const relatedProducts = useMemo(() => {
    // Find products in the same collection, exclude current
    let filtered = PRODUCTS.filter(p => p.collection === collection && p.id !== currentProductId)
    
    // If we don't have enough in the same collection, grab some best sellers or just other products
    if (filtered.length < 4) {
      const others = PRODUCTS.filter(p => p.id !== currentProductId && p.collection !== collection)
      filtered = [...filtered, ...others].slice(0, 4)
    }
    
    // Return exactly 4
    return filtered.slice(0, 4)
  }, [currentProductId, collection])

  if (relatedProducts.length === 0) return null

  return (
    <div className="py-24 border-t border-divider bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <h2 className="font-serif text-3xl md:text-4xl text-primary text-center mb-16">
          YOU MAY ALSO LIKE
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {relatedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}
