'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useApp } from '../../../context/AppContext';
import ProductCard from '../../../components/ProductCard';
import Breadcrumbs from '../../../components/Breadcrumbs';

export default function WishlistPage() {
  const { wishlist, wishlistItems, wishlistLoading, refreshWishlist } = useApp();

  // Always show the latest server wishlist when the page is opened.
  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  // Server products, minus any whose heart was just un-clicked (so removals vanish instantly).
  const wishlistProducts = wishlistItems.filter(product => wishlist.includes(product.slug));

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
        {wishlistLoading && wishlistProducts.length === 0 ? null : wishlistProducts.length === 0 ? (
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
            {/* Un-hearting removes a card mid-grid, so it fades out and the rest slide up
                instead of the whole grid jumping. */}
            <AnimatePresence mode="popLayout" initial={false}>
              {wishlistProducts.map(product => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full"
                >
                  <ProductCard product={product} className="h-full" moveToCart />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </main>
  );
}
