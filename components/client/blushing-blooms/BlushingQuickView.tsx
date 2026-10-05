'use client';

import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LuxuryImage from '@/components/LuxuryImage';
import { MAX_CART_QUANTITY } from '@/lib/cart-limits';
import type { Product } from '@/types';
import { blushingFontVars } from './fonts';
import { ColorSwatch, GoldButton, SOFT_GOLD, StarRating } from './ui';
import { formatNumber } from '@/lib/utils';

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


/*
 * Open/close motion.
 *
 * A spring on the way in — a modal that settles rather than stops reads as a physical object,
 * and a spring stays smooth if you close it again mid-open instead of jumping. Damping is high
 * enough that the panel never visibly overshoots its size; this is a 4xl box, and bounce on
 * something that large looks like a glitch.
 *
 * Out is a plain tween at roughly 60% of the in duration, easing IN rather than out: a
 * dismissal should leave promptly and accelerate away, while an entrance should decelerate
 * into place. Only `opacity` and `transform` are animated, so both directions stay on the
 * compositor.
 */
const EASE_IN = [0.4, 0, 1, 1] as const;
const PANEL_IN = { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 } as const;
const PANEL_OUT = { duration: 0.16, ease: EASE_IN } as const;
const OVERLAY_IN = { duration: 0.24, ease: [0.23, 1, 0.32, 1] } as const;
const OVERLAY_OUT = { duration: 0.16, ease: EASE_IN } as const;

const qar = (n: number) => `QAR ${formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BlushingQuickView({
  product: requested,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const reduceMotion = useReducedMotion();

  /*
   * `requested` drops to null the moment something closes the dialog, but the panel is still
   * animating out at that point — rendering from it directly would blank the contents mid-flight
   * and collapse the box. So the last product opened is held here and only `open` flips; the
   * subtree is torn down by AnimatePresence once the exit finishes.
   *
   * Everything below therefore reads `product`, unchanged, and the reset effect keys off it —
   * which also stops the colour selection snapping back to the first swatch on the way out.
   */
  const [product, setProduct] = useState<Product | null>(requested);
  const open = requested !== null;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (requested) setProduct(requested);
  }, [requested]);
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

  /*
   * Reduced motion keeps the cross-fade — which carries the "something appeared" signal — and
   * drops the travel and the scale, the parts that actually provoke motion sickness.
   */
  const panelFrames = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 6 },
      };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      {/*
        `forceMount` on all three, with AnimatePresence owning the unmount.
        Radix's own Presence drops the portal as soon as `open` flips, which cuts any exit
        animation off at the first frame — the panel simply vanished. Handing the teardown to
        AnimatePresence is what lets the close actually play.
      */}
      <AnimatePresence>
        {open && (
          // Explicit key: opening a second card while the first is still closing then
          // reverses the same spring instead of racing two subtrees.
          <Dialog.Portal key="bb-quick-view" forceMount>
            {/* The grid stays visible and dimmed behind, as the design shows. */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[90] bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: OVERLAY_OUT }}
                transition={OVERLAY_IN}
              />
            </Dialog.Overlay>
            {/*
              Box geometry is copied from components/QuickViewModal.tsx so both quick views are the
              same size at every breakpoint: the same centring wrapper and padding, `max-w-4xl`, a
              50/50 split at `md`, and a 500px-tall media panel with a scrolling detail column.
              Only the surface is different — dark ground, gold accents, rounded corners.
            */}
            <div className="fixed inset-0 z-[91] flex items-center justify-center overflow-y-auto p-[clamp(0.75rem,2.5vw,1.5rem)] pb-[max(env(safe-area-inset-bottom),clamp(0.75rem,2.5vw,1.5rem))] pt-[max(env(safe-area-inset-top),clamp(0.75rem,2.5vw,1.5rem))]">
          <Dialog.Content asChild forceMount aria-describedby={undefined}>
            <motion.div
            data-bb-page
            className={`${blushingFontVars} relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border bg-[#0b0a09] font-sans text-white focus:outline-none md:flex-row`}
            style={{ borderColor: 'rgba(255,255,255,0.16)' }}
            initial={panelFrames.initial}
            animate={panelFrames.animate}
            exit={{ ...panelFrames.exit, transition: PANEL_OUT }}
            transition={PANEL_IN}
          >
          <Dialog.Close
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white md:right-5 md:top-5 md:bg-transparent md:backdrop-blur-none"
          >
            <X size={20} strokeWidth={1.5} />
          </Dialog.Close>

          {/* Media — a square-ish panel on the left at desktop, a banner on top below lg. */}
          {/*
            `md:h-125` was a flat 500px: taller than the usable area on a short laptop, so the
            dialog outgrew the screen. Tied to viewport height it keeps the designed size where
            there is room and shrinks instead of overflowing where there is not.
          */}
          <div className="relative aspect-square max-h-[45svh] w-full shrink-0 bg-[#151211] md:aspect-auto md:h-[clamp(16rem,52svh,31.25rem)] md:max-h-full md:w-1/2">
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
          <div className="no-scrollbar relative flex w-full min-h-0 min-w-0 flex-col justify-between gap-6 overflow-y-auto overscroll-contain px-5 pt-5 md:max-h-[500px] md:w-1/2 md:gap-8 md:p-8">
            {/* Warm glow behind the copy, matching the design's rotated ellipse. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[-20%] top-1/2 -z-10 hidden h-[420px] w-[420px] -translate-y-1/2 md:block"
              style={{ background: 'radial-gradient(closest-side, rgba(204,150,90,0.16), transparent 70%)' }}
            />

            <div className="flex flex-col gap-3">
              <Dialog.Title className="font-serif text-[clamp(1.375rem,2.2vw,1.625rem)] font-semibold capitalize leading-tight tracking-[0.08em] text-white">
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
                <StarRating
                  rating={product.rating}
                  starSize={18}
                  starClassName="md:h-5 md:w-5"
                  textClassName="text-[13px] md:text-[14px]"
                />
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
                    {product.colors.map((c) => (
                      <ColorSwatch
                        key={c.name}
                        hex={c.hex}
                        name={c.name}
                        selected={c.name === colorName}
                        onSelect={() => setColorName(c.name)}
                        className="h-7 w-7 ring-offset-[#0b0a09] md:h-8 md:w-8"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity · add · wishlist — one row on a phone, the heart never drops below. */}
            <div className="sticky bottom-0 -mx-5 flex items-center gap-2 bg-[#0b0a09] px-5 pb-5 pt-3 md:static md:mx-0 md:flex-wrap md:gap-2.5 md:bg-transparent md:p-0">
              <div
                className="flex h-11 shrink-0 items-center gap-2.5 rounded-[62px] px-3 md:gap-3 md:px-4"
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

              <GoldButton onClick={handleAddToCart} className="h-11 min-w-0 flex-1 rounded-[62px] md:min-w-[150px]">
                <ShoppingCart size={18} strokeWidth={1.5} className="shrink-0" />
                {/* truncate, not wrap: a 320px phone shortens the label rather than growing the row. */}
                <span className="truncate">Add to Cart</span>
              </GoldButton>

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
            </motion.div>
          </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
