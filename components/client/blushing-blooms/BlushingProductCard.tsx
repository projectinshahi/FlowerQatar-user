'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Star, PlusCircle, Eye } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LuxuryImage from '@/components/LuxuryImage';
import { BlushingBadge, ColorSwatch, GoldButton } from './ui';
import type { Product } from '@/types';

/**
 * Blushing Blooms product card.
 *
 * A presentation-only sibling of components/ProductCard.tsx, NOT a replacement: the shared card
 * is light-themed (white surface, square corners, maroon type) and is used by /shop, search,
 * wishlist and the home carousels. Re-skinning it would have meant threading a theme flag
 * through every class in a file the rest of the storefront depends on. The cart, wishlist and
 * quick-view behaviour below is the same `useApp()` contract the shared card uses, so there is
 * no second cart implementation — only a second surface.
 *
 * Cards with no `slug` are the fallback previews from data/blushing-blooms.ts. They render
 * inert: no product link and no add-to-cart, because there is no database row behind them.
 */

/** The five swatch dots the design shows; more colours than that would break the row. */
const MAX_SWATCHES = 5;

export default function BlushingProductCard({
  product,
  onQuickView,
  priority = false,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
  priority?: boolean;
}) {
  const { wishlist, toggleWishlist, addToCart } = useApp();

  const isLinked = Boolean(product.slug);
  /*
   * The category is carried into the product URL so `loading.tsx` can show the dark Blushing
   * Blooms skeleton instead of the cream storefront one — it cannot know the category itself,
   * because the fallback renders before the product is fetched. The page ignores the parameter.
   */
  const href = `/product/${product.slug}?category=blushing-blooms`;
  const isWishlisted = wishlist.includes(product.slug);
  const badge = product.badge || (product.isBestSeller ? 'Best Seller' : null);

  /**
   * Quick add is a one-click purchase: it puts the product in the basket and opens nothing.
   * The default colour is `colors[0]`, which mapDbProductToStore already orders as the
   * product's default variant colour — so `product.price` is that colour's price and the two
   * cannot disagree. Anything needing a choice (colour, quantity, gifts) is quick view's job.
   *
   * This is the same `addToCart` contract the shared card and the product page use, so a guest
   * gets the standard sign-in prompt rather than a second, divergent cart path.
   */
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      product: { id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image },
      quantity: 1,
      roseColor: product.colors?.[0]?.name || 'Default',
      boxColor: product.boxColors?.[0]?.name || 'Standard',
      boxShape: product.boxShape,
      size: product.sizes?.[0],
      price: product.price,
    });
  };

  const media = (
    <LuxuryImage
      src={product.image}
      alt={product.name}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 460px"
      priority={priority}
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
    />
  );

  return (
    <article className="group flex flex-col items-center gap-[clamp(0.75rem,1.2vw,1.125rem)] rounded-[clamp(1.25rem,2.2vw,2rem)] border border-[rgba(43,43,43,0.8)] bg-[#1e1918] px-3 pb-[clamp(1rem,1.6vw,1.5rem)] pt-[clamp(0.75rem,1.3vw,1.1875rem)]">
      {/* Media + overlays. aspect-[42/41] is the design's 420x410 frame. */}
      <div className="relative w-full overflow-hidden rounded-t-[20px] lg:rounded-t-[28px]">
        <div className="relative aspect-[42/41] w-full">
          {isLinked ? (
            <Link href={href} className="absolute inset-0 block" aria-label={product.name}>
              {media}
            </Link>
          ) : (
            media
          )}

          {/* Badge + wishlist (left), rating (right) */}
          <div className="pointer-events-none absolute inset-x-0 top-4 flex items-center justify-between px-4 sm:top-5 sm:px-5">
            <div className="pointer-events-auto flex items-center gap-[11px]">
              {badge && (
                <BlushingBadge>{badge}</BlushingBadge>
              )}
              {isLinked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleWishlist(product.slug);
                  }}
                  suppressHydrationWarning
                  aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                  aria-pressed={isWishlisted}
                  className="text-white/80 transition-colors hover:text-white"
                >
                  <Heart size={19} strokeWidth={1.5} className={isWishlisted ? 'fill-[#e05ba2] text-[#e05ba2]' : ''} />
                </button>
              )}
            </div>

            <div className="pointer-events-auto flex items-center gap-[11px] text-[10px] tracking-[0.1em] text-white sm:text-[11.5px]">
              <Star size={19} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <span className="sr-only">Rated </span>
                {(product.rating ?? 5).toFixed(1)}
                <span className="sr-only"> out of 5</span>
              </span>
            </div>
          </div>

          {/*
            Quick actions.
            Two distinct intents, and deliberately not symmetrical: QUICK VIEW raises an intent
            the page turns into the configurator dialog, while QUICK ADD writes straight to the
            cart and opens nothing at all.

            The design reveals these on hover, which a touch device can never trigger — and both
            are the whole point of the card, so gating them behind hover would put them out of
            reach on a phone entirely. Below md they are simply always visible; from md up the
            designed hover reveal applies unchanged.
          */}
          {isLinked && (
            <div className="absolute inset-x-3 bottom-2 flex gap-[5px] transition-all duration-300 ease-out md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:motion-safe:translate-y-2">
              {onQuickView && (
                <GoldButton
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    onQuickView(product);
                  }}
                  className="h-10 flex-1 rounded-[24px]"
                >
                  <PlusCircle size={20} strokeWidth={1.5} />
                  Quick View
                </GoldButton>
              )}
              <GoldButton onClick={handleQuickAdd} className="h-10 flex-1 rounded-[24px]">
                <Eye size={20} strokeWidth={1.5} />
                Quick Add
              </GoldButton>
            </div>
          )}
        </div>
      </div>

      {/* Title / price / swatches */}
      <div className="flex w-full flex-col gap-[10px] px-1">
        <div>
          <h3 className="truncate text-[clamp(0.875rem,0.8113rem_+_0.2614vw,1.125rem)] font-medium capitalize tracking-[0.1em] text-[#7f7f7f]">
            {isLinked ? <Link href={href}>{product.name}</Link> : product.name}
          </h3>
          <p className="mt-2 text-[clamp(1.0625rem,0.9988rem_+_0.2614vw,1.3125rem)] font-medium tracking-[0.1em] text-white">
            QAR {product.price}
          </p>
        </div>

        {product.colors?.length > 0 && (
          <ul className="flex items-center gap-2" aria-label="Available colours">
            {product.colors.slice(0, MAX_SWATCHES).map((color) => (
              <li key={color.name} className="flex">
                <ColorSwatch
                  hex={color.hex}
                  name={color.name}
                  className="h-4 w-4 ring-white/10 sm:h-5 sm:w-5"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
