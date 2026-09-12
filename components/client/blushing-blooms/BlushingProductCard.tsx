'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Star, Plus, Eye } from 'lucide-react';
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
    <article className="group flex flex-col items-center gap-2 rounded-[clamp(1.25rem,2.2vw,2rem)] border border-[rgba(43,43,43,0.8)] bg-[#1e1918] px-3 pb-2.5 pt-2 sm:gap-[clamp(0.75rem,1.2vw,1.125rem)] sm:pb-[clamp(1rem,1.6vw,1.5rem)] sm:pt-[clamp(0.75rem,1.3vw,1.1875rem)]">
      {/*
        Media + overlays. aspect-[42/41] is the design's 420x410 frame, kept from sm up.

        Below sm the frame is 4/5 instead. The listing is 2-up on a phone, so a near-square
        frame on a ~148px column left the arrangement smaller than the card's own chrome — the
        photograph read as a thumbnail above a block of text rather than as the product. A ratio
        rather than a height is what keeps that proportion identical on every phone width.
      */}
      <div className="relative w-full overflow-hidden rounded-t-[20px] lg:rounded-t-[28px]">
        <div className="relative aspect-[4/5] w-full sm:aspect-[42/41]">
          {isLinked ? (
            <Link href={href} className="absolute inset-0 block" aria-label={product.name}>
              {media}
            </Link>
          ) : (
            media
          )}

          {/* Badge + wishlist (left), rating (right) */}
          <div className="pointer-events-none absolute inset-x-0 top-3 flex items-center justify-between gap-1 px-2 sm:top-5 sm:px-5">
            <div className="pointer-events-auto flex min-w-0 items-center gap-1 sm:gap-[11px]">
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

            <div className="pointer-events-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] tracking-[0.1em] text-white sm:gap-[11px] sm:text-[11.5px]">
              <Star size={16} strokeWidth={1.5} aria-hidden="true" className="sm:h-[19px] sm:w-[19px]" />
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
            reach entirely. The reveal is therefore keyed on the POINTER, not only on the
            breakpoint: `@media (hover: hover)` is what actually distinguishes a mouse from a
            finger, and a tablet or touch laptop is wider than md while having neither hover nor
            a way to produce one. Hiding on width alone left the pair permanently at opacity 0
            on every iPad and touch laptop. So they are always visible below md and on any
            touch pointer; a mouse from md up keeps the designed hover reveal, unchanged.

            Below sm they are small icon-only circles in the bottom corners of the frame — plus
            on the left, eye on the right. The listing is 2-up on a phone, so the card is ~174px
            wide: pills there — labelled or not — ran the full width of the frame and buried the
            arrangement, which is the one thing the card exists to sell. Split to opposite ends,
            the pair costs two corners and leaves the middle of the photograph clear.

            The circle is 36px but the TOUCH TARGET is 44px: `after:-inset-1` extends the hit
            area 4px past the ink on every side. Drawing a 44px circle would put 94px of chrome
            across a 174px card, and shrinking the target to match the ink would drop it under
            the 44px minimum a thumb needs — splitting the two keeps the photograph clear and
            the control honestly tappable. The pseudo-element is dropped at sm, where the pill
            is its own target.

            They are pinned to the frame, not to the content: the media box is a fixed 42/41
            ratio, so `bottom-2 right-2` lands on precisely the same spot on every card whatever
            the photograph is. From sm up the designed labelled pills return, unchanged.
          */}
          {isLinked && (
            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between transition-all duration-300 ease-out sm:inset-x-3 sm:justify-start sm:gap-[5px] md:group-hover:translate-y-0 md:group-hover:opacity-100 md:[@media(hover:hover)]:opacity-0 md:motion-safe:[@media(hover:hover)]:translate-y-2">
              {onQuickView && (
                <GoldButton
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    onQuickView(product);
                  }}
                  /* The label carries the name on desktop; icon-only, the button needs its own. */
                  aria-label={`Quick view ${product.name}`}
                  className="relative h-9 w-9 shrink-0 rounded-full p-0 after:absolute after:-inset-1 after:content-[''] sm:h-10 sm:w-auto sm:flex-1 sm:rounded-[24px] sm:after:hidden"
                >
                  {/*
                    One glyph per action now, at both breakpoints: an eye for viewing, a plus for
                    adding. The pills used to carry the opposite pair — a plus-circle on view and
                    an eye on add — so each button needed a second, hidden icon to read correctly
                    once the mobile labels came off. Sizing is a class rather than lucide's `size`
                    prop so the one element can be 17px beside a bare circle and the designed 20px
                    beside its label; CSS width/height wins over the SVG's own attributes.
                  */}
                  <Eye strokeWidth={1.5} className="h-[17px] w-[17px] sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Quick View</span>
                </GoldButton>
              )}
              <GoldButton
                onClick={handleQuickAdd}
                aria-label={`Quick add ${product.name} to cart`}
                /*
                  `order-first` only — the markup keeps Quick View first so the sm+ pill row and
                  the tab order both stay as they were; on mobile the plus is simply painted at
                  the other end. Reordering the JSX instead would have moved the desktop pills.
                */
                className="relative order-first h-9 w-9 shrink-0 rounded-full p-0 after:absolute after:-inset-1 after:content-[''] sm:order-none sm:h-10 sm:w-auto sm:flex-1 sm:rounded-[24px] sm:after:hidden"
              >
                <Plus strokeWidth={2} className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Quick Add</span>
              </GoldButton>
            </div>
          )}
        </div>
      </div>

      {/* Title / price / swatches */}
      <div className="flex w-full flex-col gap-1.5 px-1 sm:gap-[10px]">
        <div>
          <h3 className="truncate text-[12px] font-medium capitalize tracking-[0.1em] text-[#7f7f7f] sm:text-[clamp(0.875rem,0.8113rem_+_0.2614vw,1.125rem)]">
            {isLinked ? <Link href={href}>{product.name}</Link> : product.name}
          </h3>
          <p className="mt-1 text-[15px] font-medium tracking-[0.1em] text-white sm:mt-2 sm:text-[clamp(1.0625rem,0.9988rem_+_0.2614vw,1.3125rem)]">
            QAR {product.price}
          </p>
        </div>

        {product.colors?.length > 0 && (
          <ul className="flex items-center gap-1.5 sm:gap-2" aria-label="Available colours">
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
