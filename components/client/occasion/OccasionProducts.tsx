'use client';

import { useState } from 'react';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import type { Product } from '@/types';

/**
 * Product grid for /occasion/[slug].
 *
 * A thin client wrapper only so the shared <ProductCard /> gets its cart/wishlist
 * context and quick-view handler — the same wiring ShopClient uses. Wishlist, add to
 * cart, quick view, badges and pricing all come from the existing card; nothing is
 * re-implemented here.
 */
export default function OccasionProducts({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const openQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  if (products.length === 0) {
    return (
      <p className="py-16 text-center font-sans text-[11px] uppercase tracking-[0.2em] text-muted">
        No products in this collection yet.
      </p>
    );
  }

  return (
    <>
      {/* Same grid treatment as the shop listing. */}
      <div className="grid grid-cols-2 gap-0 border-l border-t border-divider/40 lg:grid-cols-3">
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={openQuickView}
            priority={i < 3}
          />
        ))}
      </div>

      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}
