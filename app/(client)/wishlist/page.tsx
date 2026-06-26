'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../../../context/AppContext';
import { PRODUCTS } from '../../../data/products';
import ProductCard from '../../../components/ProductCard';
import Breadcrumbs from '../../../components/Breadcrumbs';

export default function WishlistPage() {
  const { wishlist } = useApp();

  // Find products that match wishlist slugs
  const wishlistProducts = PRODUCTS.filter(product => wishlist.includes(product.slug));

  return (
    <main className="min-h-screen bg-[#F8F8F8] pt-[120px] pb-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        <Breadcrumbs items={[{ label: 'Wishlist' }]} />

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-serif text-3xl md:text-[40px] text-primary font-light mb-4 tracking-wide uppercase">
            MY WISHLIST
          </h1>
          <div className="w-12 h-[1px] bg-[#C1A87D] mx-auto mb-6"></div>
          <p className="font-sans text-[10px] md:text-[11px] text-[#888] uppercase tracking-[0.2em]">
            {wishlistProducts.length} {wishlistProducts.length === 1 ? 'Item' : 'Items'}
          </p>
        </div>

        {/* Wishlist Content */}
        {wishlistProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white py-24 shadow-sm">
            <p className="font-serif text-xl md:text-2xl text-primary mb-8 text-center">
              Your wishlist is currently empty.
            </p>
            <Link 
              href="/shop"
              className="bg-black hover:bg-secondary text-white font-sans text-[10px] uppercase tracking-[0.2em] px-10 py-4 transition-colors duration-300 font-medium"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
