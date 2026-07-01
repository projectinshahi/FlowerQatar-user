'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import LuxuryImage from './LuxuryImage';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  priority?: boolean;
}

export default function ProductCard({ product, onQuickView, priority = false }: ProductCardProps) {
  const { wishlist, toggleWishlist, addToCart } = useApp();
  const [hovered, setHovered] = useState(false);

  const isWishlisted = wishlist.includes(product.slug);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Choose default colors if they exist
    const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0].name : 'Classic Red';
    const defaultBoxColor = product.boxColors && product.boxColors.length > 0 ? product.boxColors[0].name : 'Matte Black';
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;

    addToCart({
      product: {
        slug: product.slug,
        name: product.name,
        price: product.price,
      },
      quantity: 1,
      roseColor: defaultColor,
      boxColor: defaultBoxColor,
      boxShape: product.boxShape,
      size: defaultSize,
      price: product.price,
    });
  };

  const mainImage = product.image || (product.images && product.images[0]) || '';
  const hoverImage = product.hoverImage || (product.images && product.images[1]) || '';

  return (
    <div
      className="luxury-card group relative flex flex-col font-sans"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-square bg-cream overflow-hidden">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          {/* Main Image */}
          <div className="absolute inset-0 transition-transform duration-700 ease-out transform group-hover:scale-105">
            <LuxuryImage
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover transition-opacity duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
            />
          </div>

          {/* Alternate Image on Hover */}
          {hoverImage && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out transform group-hover:scale-105">
              <LuxuryImage
                src={hoverImage}
                alt={`${product.name} alternate`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          )}
        </Link>

        {/* Wishlist Icon */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.slug);
          }}
          suppressHydrationWarning
          className="absolute top-3 right-3 z-10 p-2 bg-white text-accent hover:opacity-80 transition-opacity duration-300 rounded-none shadow-sm"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            className={`transition-colors duration-300 ${isWishlisted ? 'fill-accent text-accent' : 'text-accent'}`}
          />
        </button>

        {/* Custom Badges (Best Seller / New / Romantic) */}
        {(product.badge || product.isBestSeller || product.isNew) && (
          <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
            {product.isBestSeller && (
              <span className="bg-primary px-2 py-0.5 text-[8px] text-white uppercase tracking-[0.2em] font-medium font-sans">
                Best Seller
              </span>
            )}
            {product.isNew && (
              <span className="bg-secondary px-2 py-0.5 text-[8px] text-white uppercase tracking-[0.2em] font-medium font-sans">
                New
              </span>
            )}
            {product.badge && !product.isBestSeller && !product.isNew && (
              <span className="bg-secondary px-2 py-0.5 text-[8px] text-white uppercase tracking-[0.2em] font-medium font-sans">
                {product.badge}
              </span>
            )}
          </div>
        )}

        {/* Slide-up CTA actions on hover (Desktop only) */}
        <div className="absolute inset-x-0 bottom-0 bg-white/95 border-t border-divider p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-350 ease-out z-10 hidden md:flex space-x-2">
          {onQuickView && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              suppressHydrationWarning
              className="flex-1 bg-cream hover:bg-primary hover:text-white py-2 px-1 flex items-center justify-center space-x-1.5 text-[9px] uppercase tracking-[0.15em] text-primary font-medium border border-divider transition-colors duration-300"
            >
              <Eye size={10} />
              <span>Quick View</span>
            </button>
          )}
          <button
            onClick={handleQuickAdd}
            suppressHydrationWarning
            className="flex-1 bg-primary hover:bg-secondary hover:text-white text-white py-2 px-1 flex items-center justify-center space-x-1.5 text-[9px] uppercase tracking-[0.15em] font-medium transition-colors duration-300"
          >
            <ShoppingBag size={10} />
            <span>Quick Add</span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-grow justify-between bg-white">
        <div className="flex flex-col space-y-1">
          <span className="text-[9px] text-muted uppercase tracking-[0.15em]">
            {product.collection.replace('-', ' ')}
          </span>
          <h3 className="text-xs uppercase tracking-[0.1em] font-medium text-primary line-clamp-1 group-hover:text-secondary transition-colors duration-300">
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>
        
        <div className="mt-2 pt-2 border-t border-divider/40 flex justify-between items-center">
          <div className="flex items-center space-x-1">
            {product.originalPrice && (
              <span className="text-[10px] text-muted line-through">
                QAR {product.originalPrice}
              </span>
            )}
            <span className="text-xs font-semibold text-primary">
              QAR {product.price}
            </span>
          </div>
          
          <button
            onClick={handleQuickAdd}
            suppressHydrationWarning
            className="text-[9px] uppercase tracking-[0.1em] text-secondary hover:text-primary font-semibold transition-colors duration-300 flex items-center space-x-0.5"
          >
            <span className="hidden sm:inline">Quick Add</span>
            <span className="sm:hidden">Add</span>
            <span>+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
