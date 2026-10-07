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
  className?: string;
  /** Wishlist page: a quick add moves the product to the cart, so drop the heart too. */
  moveToCart?: boolean;
  /**
   * Show the colour name in the subtitle and the colour swatch dots. When not set, only
   * Blushing Blooms products show them — for every other category the colour row is hidden.
   */
  showColors?: boolean;
}

export default function ProductCard({ product, onQuickView, className = '', moveToCart = false, showColors }: ProductCardProps) {
  const { wishlist, toggleWishlist, addToCart, user } = useApp();
  const [hovered, setHovered] = useState(false);

  const isWishlisted = wishlist.includes(product.slug);
  const colorsVisible = showColors ?? product.categoryType === 'BLUSHING_BLOOMS';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0].name : 'Classic Red';
    const defaultBoxColor = product.boxColors && product.boxColors.length > 0 ? product.boxColors[0].name : 'Matte Black';
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;

    addToCart({
      /*
       * `id` and `image` both matter here.
       *
       * Without the id the server cannot resolve the product, so the line is stored as an
       * unidentified "custom arrangement": it falls back to the stored selection, which is
       * why a quick-added item showed no picture in the cart - and why its price was the
       * browser's figure rather than one re-derived from the database. With the id the line
       * is rebuilt from the live product, image included. `image` stays as the fallback for
       * a product whose id is missing (the mock catalogue) or later deleted.
       *
       * The same shape QuickViewModal and the product page already send.
       */
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image || (product.images && product.images[0]),
      },
      quantity: 1,
      roseColor: defaultColor,
      boxColor: defaultBoxColor,
      boxShape: product.boxShape,
      size: defaultSize,
      price: product.price,
    });

    // Guests only get the sign-in prompt from addToCart — nothing was added, so keep the heart.
    if (moveToCart && user && isWishlisted) toggleWishlist(product.slug);
  };

  const mainImage = product.image || (product.images && product.images[0]) || '';
  const hoverImage = product.hoverImage || (product.images && product.images[1]) || '';

  // Only real, resolved names — never the subcategory id, which is a UUID.
  const subtitle = [product.collectionName, colorsVisible ? product.colors?.[0]?.name : null]
    .filter(Boolean)
    .join(' • ');

  return (
    <div
      className={`group relative flex flex-col border-r border-b border-divider/40 ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-square bg-[#F8F8F8] overflow-hidden">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          {/* Main Image */}
          <div className="absolute inset-0 transition-opacity duration-700 ease-in-out">
            <LuxuryImage
              src={mainImage}
              alt={product.name}
              fill
              className={`object-cover transition-opacity duration-700 ${hoverImage && hovered ? 'opacity-0' : 'opacity-100'}`}
              // Every grid using this card is 2 columns below lg and 3 from lg up.
              sizes="(max-width: 1023px) 50vw, 33vw"
            />
          </div>

          {/* Alternate Image on Hover. Not rendered on touch screens, which cannot hover — so
              phones do not download a second image per card. */}
          {hoverImage && (
            <div className={`absolute inset-0 transition-opacity duration-700 ease-in-out [@media(hover:none)]:hidden ${hovered ? 'opacity-100' : 'opacity-0'}`}>
              <LuxuryImage
                src={hoverImage}
                alt={`${product.name} alternate`}
                fill
                className="object-cover"
                sizes="(max-width: 1023px) 50vw, 33vw"
              />
            </div>
          )}
        </Link>

        {/* Top Badges & Heart & Rating */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none z-10">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            {(product.badge || product.isBestSeller || product.isNew) && (
              <span className="bg-[#EBE9DF] px-2 py-0.5 text-[9px] text-[#2C3826] uppercase tracking-[0.1em] font-medium font-sans">
                {product.badge || (product.isBestSeller ? 'Pre-Order' : 'Limited Quantities')}
              </span>
            )}
          </div>

          {/* Right corner: wishlist heart, then the rating to its right. */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.slug);
              }}
              suppressHydrationWarning
              className="text-secondary/60 hover:text-secondary transition-transform duration-200 ease-out hover:scale-110 active:scale-90"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
            >
              <Heart
                size={16}
                strokeWidth={1.5}
                className={`transition-all duration-300 ease-out ${isWishlisted ? 'fill-secondary text-secondary scale-110' : 'scale-100'}`}
              />
            </button>
            <div className="flex items-center gap-1 text-[10px] text-secondary font-sans">
              <span className="text-[12px] mb-0.5">☆</span>
              <span>{product.rating?.toFixed(1) || "5.0"}</span>
            </div>
          </div>
        </div>

        {/* Slide-up CTA actions on hover (Desktop only) */}
        <div className="absolute inset-x-0 bottom-0 bg-white/95 border-t border-divider p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-350 ease-out z-10 hidden md:flex space-x-2 pointer-events-auto">
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
      <div className="p-4 flex flex-col flex-grow bg-white">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-serif text-[15px] leading-tight text-primary group-hover:text-secondary transition-colors duration-300">
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
          <span className="font-sans text-[11px] font-medium text-secondary whitespace-nowrap">
            QAR {product.price}
          </span>
        </div>
        
        {/*
          Subcategory name + the first colour's name, both resolved from the database.
          This line previously rendered `product.collection`, which is the subcategory UUID,
          next to a hardcoded "CRÈME CHANTILLY" — so customers saw a raw id and a colour that
          had nothing to do with the product. Renders nothing when neither is known rather
          than falling back to an id.
        */}
        {subtitle && (
          <p className="font-sans text-[9px] text-muted uppercase tracking-[0.15em] mt-1.5 line-clamp-1">
            {subtitle}
          </p>
        )}

        {/* Color swatches */}
        {colorsVisible && product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            {product.colors.slice(0, 3).map((color, idx) => (
              <div 
                key={idx} 
                className="w-3.5 h-3.5 rounded-full border border-secondary/20 shadow-sm" 
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {product.colors.length > 3 && (
              <span className="text-[10px] text-muted ml-1">+{product.colors.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
