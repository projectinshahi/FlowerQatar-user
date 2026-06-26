'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import LuxuryImage from './LuxuryImage';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [selectedRoseColor, setSelectedRoseColor] = useState('');
  const [selectedBoxColor, setSelectedBoxColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Initialize values when product changes
  React.useEffect(() => {
    if (product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRoseColor(product.colors && product.colors.length > 0 ? product.colors[0].name : '');
      setSelectedBoxColor(product.boxColors && product.boxColors.length > 0 ? product.boxColors[0].name : '');
      setSelectedSize(product.sizes ? product.sizes[0] : '');
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const isWishlisted = wishlist.includes(product.slug);

  const handleAddToCart = () => {
    addToCart({
      product: {
        slug: product.slug,
        name: product.name,
        price: product.price,
      },
      quantity,
      roseColor: selectedRoseColor,
      boxColor: selectedBoxColor,
      boxShape: product.boxShape,
      size: selectedSize || undefined,
      price: product.price,
    });
    onClose();
  };

  const mainImage = product.image || (product.images && product.images[0]) || '';

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300" />
        
        {/* Content wrapper */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <Dialog.Content className="relative w-full max-w-4xl bg-white border border-divider shadow-2xl overflow-hidden font-sans text-primary flex flex-col md:flex-row focus:outline-none animate-in fade-in zoom-in-95 duration-300 rounded-none">
            
            {/* Left: Product Images */}
            <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto md:h-125 bg-cream">
              <LuxuryImage
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Bestseller Badge */}
              {product.isBestSeller && (
                <div className="absolute top-4 left-4 z-10 bg-primary px-2.5 py-1 text-[9px] text-white uppercase tracking-[0.2em] font-medium shadow-sm">
                  Best Seller
                </div>
              )}
            </div>

            {/* Right: Info and Customization */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto md:max-h-[500px] no-scrollbar">
              
              {/* Close Button */}
              <Dialog.Close className="absolute top-4 right-4 text-muted hover:text-primary transition-colors focus:outline-none rounded-none">
                <X size={20} className="stroke-[1.5]" />
              </Dialog.Close>

              {/* Title & Price */}
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted block mb-1">
                  Venus et Fl
                </span>
                <Dialog.Title className="font-serif text-2xl md:text-3xl text-primary leading-tight mb-2">
                  {product.name}
                </Dialog.Title>
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-xl font-semibold text-primary">${product.price}</span>
                  <span className="text-xs text-muted uppercase tracking-widest">
                    ★ {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>
                <p className="text-xs text-muted/80 leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Swatches: Rose Colors */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary block mb-2">
                      1. Choose Rose Color: <span className="font-normal text-secondary">{selectedRoseColor}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedRoseColor(color.name)}
                          className={`w-6 h-6 rounded-full border transition-all duration-300 relative ${
                            selectedRoseColor === color.name ? 'border-primary scale-110 ring-1 ring-secondary' : 'border-divider hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Swatches: Box Colors */}
                {product.boxColors && product.boxColors.length > 0 && (
                  <div className="mb-6">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary block mb-2">
                      2. Choose Box Color: <span className="font-normal text-secondary">{selectedBoxColor}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.boxColors.map((box) => (
                        <button
                          key={box.name}
                          onClick={() => setSelectedBoxColor(box.name)}
                          className={`w-6 h-6 rounded-full border transition-all duration-300 relative ${
                            selectedBoxColor === box.name ? 'border-primary scale-110 ring-1 ring-secondary' : 'border-divider hover:scale-105'
                          }`}
                          style={{ backgroundColor: box.hex }}
                          title={box.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes Selector (if available) */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-6">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary block mb-2">
                      3. Select Box Arrangement Size
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {product.sizes.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`py-2 px-3 text-xs tracking-wider uppercase border text-center transition-colors duration-300 rounded-none ${
                            selectedSize === sz
                              ? 'border-primary bg-primary text-white font-medium'
                              : 'border-divider hover:border-primary bg-transparent text-primary'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom: Quantity, Add to Cart, Wishlist */}
              <div className="mt-8 pt-4 border-t border-divider flex items-center gap-4">
                <div className="flex items-center border border-divider bg-cream h-12 rounded-none">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 text-muted hover:text-primary transition-colors rounded-none"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 text-muted hover:text-primary transition-colors rounded-none"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-grow h-12 bg-primary hover:bg-secondary text-white uppercase text-[10px] tracking-[0.2em] font-medium transition-colors duration-500 flex items-center justify-center space-x-2 rounded-none"
                >
                  <ShoppingBag size={14} />
                  <span>Add To Cart</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.slug)}
                  className={`p-3 border border-divider hover:border-primary transition-colors rounded-none ${
                    isWishlisted ? 'text-secondary border-secondary' : 'text-muted'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart size={18} className={isWishlisted ? 'fill-gold' : ''} />
                </button>
              </div>

            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
