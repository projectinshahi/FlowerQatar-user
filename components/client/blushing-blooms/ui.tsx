'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { filledStars } from '@/lib/reviews';

/**
 * Shared primitives for the Blushing Blooms surface.
 *
 * These are deliberately scoped to this feature rather than dropped into components/ui/: every
 * one of them is dark-theme-only and carries the page's gold accent, so on the cream storefront
 * they would be wrong. The isolation that the rest of Blushing Blooms maintains (its own nav,
 * footer, cards and [data-bb-page] CSS) holds here too — nothing outside this folder imports
 * this file.
 *
 * One file rather than four: each of these is a handful of lines, and they are always used
 * together.
 *
 * Every component takes `className` last through `cn()`, so callers keep their own sizes,
 * radii and ring offsets — which genuinely differ per surface — while the colour, typography
 * and states stay in one place.
 */

/** The Blushing Blooms accent, previously re-declared as a local `GOLD` in four files. */
export const GOLD = '#cc965a';
/** Hover for solid gold surfaces. */
export const GOLD_HOVER = '#b9834a';
/** 10% gold — the quick view's quantity pill and wishlist button sit on this. */
export const SOFT_GOLD = 'rgba(204,150,90,0.1)';

/*
 * Card surfaces, sampled from the Figma product page (file 7f3mL0yDv102RCbV81u2rq, node
 * 156:1318) rather than derived as alpha over the gold. The design's greys are warm but far
 * darker than a tint of #cc965a produces, which is why the tiles used to read as washed-out
 * gold rectangles instead of near-black cards with a warm edge.
 */
/** ADD A GIFT tile outline. */
export const CARD_BORDER = '#231c13';
/** DELIVERY DATE / WISHING FONT tile outline. */
export const TILE_BORDER = '#2f2518';
/** Unselected greeting-card fill. */
export const TILE_BG = '#14110d';
/** Selected greeting-card fill. */
export const TILE_BG_ON = '#382a1a';
/** Base Price / Subtotal panel — the diagonal golden wash, measured corner to corner. */
export const PRICE_GRADIENT = 'linear-gradient(135deg, #3e301f 0%, #6b5031 100%)';

/**
 * Ambient gold pools — the decorative ellipses the design floats behind both Blushing Blooms
 * surfaces.
 *
 * Measured off the Figma render rather than guessed: the peak reads rgb(89,66,41) against the
 * black ground, which is GOLD at ~44% alpha, and the warmth falls to nothing about 850px out —
 * hence the 1700px box, whose closest-side radius is exactly that. The stops trace the measured
 * curve, so this lands as ambient light rather than a coloured block.
 *
 * Reproduced as CSS gradients instead of the exported SVGs: a blurred ellipse *is* a gradient,
 * and this keeps the decorative assets out of the bundle for an identical result.
 */
export function Glow({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 h-[1800px] w-[1700px] max-w-none ${className}`}
      style={{
        background:
          'radial-gradient(closest-side, rgba(204,150,90,0.44), rgba(204,150,90,0.30) 32%, rgba(204,150,90,0.10) 58%, rgba(204,150,90,0) 80%)',
      }}
    />
  );
}

/* ------------------------------------------------------------------ Gold CTA */

const CTA_BASE =
  'flex items-center justify-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const CTA_VARIANTS = {
  /** Filled gold — the primary action (add to cart, quick add). */
  solid: 'bg-[#cc965a] text-white hover:bg-[#b9834a]',
  /** White on gold type — the secondary action sitting beside a solid one. */
  outline: 'border-[0.3px] border-black/20 bg-white text-[#cc965a] hover:bg-white/90',
} as const;

/**
 * The Blushing Blooms call to action.
 *
 * Height, width and radius stay with the caller: the card's pair are `h-10 rounded-[24px]`,
 * the product page's is `h-12 w-full lg:h-10`, and the quick view's is a `rounded-[62px]` pill.
 * Only what is actually shared — the gold, the uppercase tracking, the hover — lives here.
 */
export function GoldButton({
  variant = 'solid',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof CTA_VARIANTS }) {
  return (
    // suppressHydrationWarning: these buttons are inside the cart/wishlist subtree, whose state
    // is restored from localStorage after mount. Every call site already set it.
    <button
      type="button"
      suppressHydrationWarning
      className={cn(CTA_BASE, CTA_VARIANTS[variant], className)}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------- Badge chip */

/** Gold pill for a short product tag ("Best Seller", "New"). */
export function BlushingBadge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'rounded-full bg-[#cc965a] px-[9.5px] py-[2px] text-[10px] font-medium uppercase tracking-[0.1em] text-white sm:text-[11.5px]',
        className
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- Star rating */

/**
 * Five gold stars, filled to the nearest whole star, plus the numeric rating.
 *
 * The stars are `aria-hidden` and the number carries the accessible text — five icons and a
 * figure saying the same thing would be read out twice otherwise.
 *
 * Rating only: the review count that used to follow it was dropped from the design.
 */
export function StarRating({
  rating,
  starSize = 20,
  starClassName,
  textClassName,
  className,
}: {
  rating?: number | null;
  starSize?: number;
  starClassName?: string;
  textClassName?: string;
  className?: string;
}) {
  // Shared with the cream storefront's product page so a 4.5 fills the same number of stars
  // on both surfaces.
  const filled = filledStars(rating ?? null);

  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={starSize}
            strokeWidth={1.5}
            className={starClassName}
            style={{ color: GOLD, fill: i < filled ? GOLD : 'transparent' }}
          />
        ))}
      </span>
      <p className={cn('tracking-[0.02em] text-white/70', textClassName)}>
        <span className="sr-only">Rated </span>
        {(rating ?? 5).toFixed(1)}
        <span className="sr-only"> out of 5</span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ Colour swatch */

/**
 * A circular colour dot.
 *
 * Renders a button when `onSelect` is given (the colour pickers and the listing filter) and an
 * inert span when it is not (the read-only row on the product card). The selected ring is
 * fixed; its offset colour is not, because the swatch sits on the page black, the card
 * `#1e1918` and the quick view `#0b0a09` — callers pass `ring-offset-*` through `className`.
 */
export function ColorSwatch({
  hex,
  name,
  selected = false,
  onSelect,
  className,
}: {
  hex: string;
  name: string;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}) {
  const classes = cn(
    'block shrink-0 rounded-full transition-shadow',
    selected ? 'ring-2 ring-white ring-offset-2' : 'ring-1 ring-white/15',
    className
  );

  if (!onSelect) {
    return (
      <span title={name} className={classes} style={{ backgroundColor: hex }}>
        <span className="sr-only">{name}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={name}
      title={name}
      suppressHydrationWarning
      className={classes}
      style={{ backgroundColor: hex }}
    />
  );
}

/* ---------------------------------------------------------------- Back button */

/**
 * Fixed back control for the Blushing Blooms surfaces.
 *
 * Pinned rather than scrolled away with the content: on the product page the old chevron sat
 * in the flow above the gallery and was gone the moment you read past the fold, which is the
 * point at which you actually want it.
 *
 * It floats in the gap between the nav pill (which clears 76px on mobile, 100px at sm) and the
 * page content (which starts at pt-32 / pt-40), so at rest it overlaps nothing and only passes
 * over the page once you scroll. `z-30` keeps it under the `z-40` nav rather than fighting it.
 *
 * A plain `<Link>`, not `router.back()`: every caller knows exactly where "back" goes, so this
 * never strands someone on an external page when the product URL was opened directly.
 */
export function BlushingBackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      // Same glass recipe as BlushingNav — dark tint, 10px blur, lifted saturation, hairline
      // border — so it reads as a piece of the same navigation layer.
      className="fixed left-4 top-[84px] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white/90 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)] backdrop-blur-[10px] backdrop-saturate-150 transition-[color,background-color,transform] duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 active:scale-95 motion-reduce:active:scale-100 sm:left-6 sm:top-[112px] sm:h-12 sm:w-12"
    >
      <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.5} />
    </Link>
  );
}
