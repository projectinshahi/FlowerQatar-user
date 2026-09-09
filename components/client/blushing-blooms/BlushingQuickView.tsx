'use client';

import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Heart, Minus, Plus, ShoppingCart, Star, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LuxuryImage from '@/components/LuxuryImage';
import { MAX_CART_QUANTITY } from '@/lib/validations/cart';
import type { Product } from '@/types';
import { blushingFontVars } from './fonts';

/**
 * Blushing Blooms quick view (Figma node 184:2040).
 *
 * The compact dialog: image, name, price, rating, description, colour, quantity, cart, wishlist.
 * It is what the card's QUICK VIEW opens. QUICK ADD does not open anything — it writes straight
 * to the cart from the card itself, so the two actions never overlap.
 *
 * It adds no product or cart machinery of its own: the colour list, per-colour price and rating
 * all come from the same `Product` view-model the grid renders, and the basket write is the
 * shared `useApp().addToCart`, so a guest is prompted to sign in exactly as everywhere else.
 *
 * Radix portals the content outside the page subtree, so `data-bb-page` and the font variables
 * are re-declared here — without them the scoped rules in globals.css stop applying.
 */

const GOLD = '#cc965a';
const SOFT_GOLD = 'rgba(204,150,90,0.1)';

const qar = (n: number) => `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BlushingQuickView({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [colorName, setColorName] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Reset per product so a previous selection never leaks into the next card opened.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColorName(product?.colors?.[0]?.name ?? null);
    setQuantity(1);
  }, [product?.id, product?.slug, product?.colors]);

  if (!product) return null;

  const selectedColor = product.colors?.find((c) => c.name === colorName) ?? product.colors?.[0] ?? null;
  // The colour's own price when the catalogue has one, else the product's default.
  const unitPrice = selectedColor?.price ?? product.price;
  const wasPrice = selectedColor?.originalPrice ?? product.originalPrice;
  const image = selectedColor?.image || product.image || '';
  const isWishlisted = wishlist.includes(product.slug);

  const step = (d: 1 | -1) => setQuantity((q) => Math.min(MAX_CART_QUANTITY, Math.max(1, q + d)));

  const handleAddToCart = () => {
    addToCart({
      product: { id: product.id, slug: product.slug, name: product.name, price: unitPrice, image },
      quantity,
      roseColor: selectedColor?.name || 'Default',
      boxColor: 'Standard',
      price: unitPrice,
      calculatedPrice: unitPrice * quantity,
    });
    onClose();
  };

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        {/* The grid stays visible and dimmed behind, as the design shows. */}
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/70" />
        {/*
          Box geometry is copied from components/QuickViewModal.tsx so both quick views are the
          same size at every breakpoint: the same centring wrapper and padding, `max-w-4xl`, a
          50/50 split at `md`, and a 500px-tall media panel with a scrolling detail column.
          Only the surface is different — dark ground, gold accents, rounded corners.
        */}
        <div className="fixed inset-0 z-[91] flex items-center justify-center overflow-y-auto p-4 md:p-6">
          <Dialog.Content
            data-bb-page
            className={`${blushingFontVars} relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border bg-[#0b0a09] font-sans text-white focus:outline-none md:flex-row`}
            style={{ borderColor: 'rgba(255,255,255,0.16)' }}
            aria-describedby={undefined}
          >
          <Dialog.Close
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white md:right-5 md:top-5"
          >
            <X size={20} strokeWidth={1.5} />
          </Dialog.Close>

          {/* Media — a square-ish panel on the left at desktop, a banner on top below lg. */}
          <div className="relative aspect-square w-full shrink-0 bg-[#151211] md:aspect-auto md:h-125 md:w-1/2">
            {image ? (
              <LuxuryImage
                key={image}
                src={image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
            ) : null}
          </div>

          {/* Detail */}
          <div className="no-scrollbar relative flex w-full min-w-0 flex-col justify-between gap-8 overflow-y-auto p-6 md:max-h-[500px] md:w-1/2 md:p-8">
            {/* Warm glow behind the copy, matching the design's rotated ellipse. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[-20%] top-1/2 -z-10 hidden h-[420px] w-[420px] -translate-y-1/2 md:block"
              style={{ background: 'radial-gradient(closest-side, rgba(204,150,90,0.16), transparent 70%)' }}
            />

            <div className="flex flex-col gap-3">
              <Dialog.Title className="font-serif text-[22px] font-semibold capitalize leading-tight tracking-[0.08em] text-white md:text-[26px]">
                {product.name}
              </Dialog.Title>

              <div className="flex flex-col gap-2">
                <p className="flex items-baseline gap-3 text-[17px] font-medium tracking-[0.1em] text-white md:text-[19px]">
                  {qar(unitPrice)}
                  {wasPrice != null && wasPrice > unitPrice && (
                    <span className="text-[12px] font-normal tracking-[0.04em] text-white/40 line-through md:text-[13px]">
                      {qar(wasPrice)}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="flex items-center gap-1.5" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        strokeWidth={1.5}
                        className="md:h-5 md:w-5"
                        style={{ color: GOLD, fill: i < Math.round(product.rating ?? 0) ? GOLD : 'transparent' }}
                      />
                    ))}
                  </span>
                  <p className="text-[13px] tracking-[0.02em] text-white/70 md:text-[14px]">
                    <span className="sr-only">Rated </span>
                    {(product.rating ?? 5).toFixed(1)}
                    <span className="sr-only"> out of 5</span>
                    {/* Hidden at zero rather than advertising "(0 Reviews)". */}
                    {product.reviewCount > 0 && ` (${product.reviewCount} Reviews)`}
                  </p>
                </div>
              </div>

              {product.description && (
                <p className="text-[12.5px] leading-relaxed tracking-[0.04em] text-white/50 md:text-[13px]">
                  {product.description}
                </p>
              )}

              {/* Colour */}
              {product.colors?.length > 0 && (
                <div className="flex flex-col gap-4 border-b pb-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <h3 className="text-[12px] font-medium uppercase tracking-[0.1em] text-white md:text-[13px]">CHOOSE COLOR</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {product.colors.map((c) => {
                      const on = c.name === colorName;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setColorName(c.name)}
                          aria-pressed={on}
                          aria-label={c.name}
                          title={c.name}
                          suppressHydrationWarning
                          className={`h-7 w-7 rounded-full transition-shadow md:h-8 md:w-8 ${
                            on ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b0a09]' : 'ring-1 ring-white/15'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity · add · wishlist */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className="flex h-11 shrink-0 items-center gap-3 rounded-[62px] px-4"
                style={{ backgroundColor: SOFT_GOLD }}
              >
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  suppressHydrationWarning
                  className="text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={15} strokeWidth={2} />
                </button>
                <span aria-live="polite" className="min-w-5 text-center text-[14px] font-medium tracking-[0.1em] text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={quantity >= MAX_CART_QUANTITY}
                  aria-label="Increase quantity"
                  suppressHydrationWarning
                  className="text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={15} strokeWidth={2} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                suppressHydrationWarning
                className="flex h-11 min-w-[150px] flex-1 items-center justify-center gap-2 rounded-[62px] text-[12px] font-medium uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: GOLD }}
              >
                <ShoppingCart size={18} strokeWidth={1.5} />
                Add to Cart
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.slug)}
                aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                aria-pressed={isWishlisted}
                suppressHydrationWarning
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[40px] transition-colors"
                style={{ backgroundColor: SOFT_GOLD }}
              >
                <Heart
                  size={18}
                  strokeWidth={1.5}
                  className={isWishlisted ? 'fill-[#e05ba2] text-[#e05ba2]' : 'text-white'}
                />
              </button>
            </div>
          </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
