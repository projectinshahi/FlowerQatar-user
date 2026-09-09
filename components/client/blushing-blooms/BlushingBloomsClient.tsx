'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Flower2, Gem, Gift, Heart, SlidersHorizontal, X } from 'lucide-react';
import { isVideoMedia } from '@/lib/media';
import BlushingQuickView from './BlushingQuickView';
import BlushingNav from './BlushingNav';
import BlushingFooter from './BlushingFooter';
import BlushingProductCard from './BlushingProductCard';
import { blushingFontVars } from './fonts';
import type { BlushingBloomsContent } from '@/lib/blushing-blooms';
import type { Product } from '@/types';

/**
 * The Blushing Blooms category experience, served at /shop?category=blushing-blooms.
 *
 * This page owns its whole surface: the shared storefront header and footer are hidden for it
 * by the [data-bb-page] rules in app/globals.css, and it renders BlushingNav / BlushingFooter
 * instead. Nothing here is reachable from another category, and no shared component is
 * restyled — the isolation is the point.
 *
 * Cart, wishlist, search and quick-view all go through the existing `useApp()` context and the
 * existing QuickViewModal, so this is a second surface over the same commerce logic, never a
 * second implementation of it.
 */

/** Brand pillars from the design. Fixed copy — the admin form manages the three media sections. */
const PILLARS = [
  { Icon: Flower2, label: 'FRESHLY CURATED', caption: 'Thoughtfully chosen gifts' },
  { Icon: Gift, label: 'BEAUTIFULLY WRAPPED', caption: 'Made for special moments' },
  { Icon: Heart, label: 'GIFTED WITH LOVE', caption: 'Every detail matters' },
  { Icon: Gem, label: 'PREMIUM SELECTION', caption: 'Flowers, scents & treats' },
] as const;

const SORT_OPTIONS = [
  { value: 'featured', label: 'FEATURED' },
  { value: 'price-low-high', label: 'PRICE: LOW TO HIGH' },
  { value: 'price-high-low', label: 'PRICE: HIGH TO LOW' },
  { value: 'newest', label: 'NEWEST' },
] as const;

/** How many products precede the video feature. Everything after it follows the video. */
const PRODUCTS_BEFORE_VIDEO = 6;

const ACCENT = '#e05ba2';
const GOLD = '#cc965a';

/**
 * Ambient gold pools — the four decorative ellipses the design floats behind the listing.
 *
 * Measured off the Figma render rather than guessed: the peak reads rgb(89,66,41) against the
 * black ground, which is GOLD at ~44% alpha, and the warmth falls to nothing about 850px out —
 * hence the 1700px box, whose closest-side radius is exactly that. The stops trace the measured
 * curve, so this lands as ambient light rather than a coloured block.
 *
 * Reproduced as CSS gradients instead of the exported SVGs: a blurred ellipse *is* a gradient,
 * and this keeps four large decorative assets out of the bundle for an identical result.
 */
function Glow({ className }: { className: string }) {
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

/**
 * Background media for a section. A single url may be an image or a video, so the type is read
 * through isVideoMedia() — the shared rule that also copes with Cloudinary urls carrying no
 * file extension. Never branch on the extension here.
 */
function SectionMedia({
  src,
  alt,
  priority = false,
  sizes = '100vw',
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (isVideoMedia({ url: src })) {
    return (
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        // Decorative background: the meaning is carried by the overlaid copy, so it is hidden
        // from assistive tech rather than announced as an unlabelled media element.
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
}

export default function BlushingBloomsClient({
  products,
  content,
}: {
  products: Product[];
  content: BlushingBloomsContent;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sortOption, setSortOption] = useState<string>('featured');
  const [quickView, setQuickView] = useState<Product | null>(null);

  /*
   * Filter options are derived from the products actually on this page, the same rule
   * components/client/shop/ShopClient.tsx follows: an option can never produce zero results.
   */
  const subcategoryOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      if (p.collection && p.collectionName && !seen.has(p.collection)) seen.set(p.collection, p.collectionName);
    }
    return [...seen.entries()].map(([key, name]) => ({ key, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const colorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) for (const c of p.colors ?? []) if (c?.name && !seen.has(c.name)) seen.set(c.name, c.hex);
    return [...seen.entries()].map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const visible = useMemo(() => {
    let result = products.filter(
      (p) =>
        (!selectedSubcategory || p.collection === selectedSubcategory) &&
        (!selectedColor || p.colors?.some((c) => c.name === selectedColor))
    );
    if (sortOption === 'price-low-high') result = [...result].sort((a, b) => a.price - b.price);
    else if (sortOption === 'price-high-low') result = [...result].sort((a, b) => b.price - a.price);
    else if (sortOption === 'newest') result = [...result].reverse();
    // 'featured' deliberately does NOT re-sort: the products arrive in the order the admin's
    // own listing defines (getStoreProducts returns newest-first, matching the admin product
    // table's default). Sorting by best-seller here meant reordering products in the admin had
    // no visible effect on the storefront.
    return result;
  }, [products, selectedSubcategory, selectedColor, sortOption]);

  /*
   * The listing is: first six products, the video feature, then EVERY remaining product.
   *
   * `slice(PRODUCTS_BEFORE_VIDEO)` takes no end index on purpose — it previously ended at
   * `PRODUCTS_BEFORE_VIDEO * 2`, which silently dropped the 13th product onward from the page.
   * The video is a section between the two runs, never a substitute for the seventh product.
   */
  const beforeVideo = visible.slice(0, PRODUCTS_BEFORE_VIDEO);
  const afterVideo = visible.slice(PRODUCTS_BEFORE_VIDEO);
  const hasFilters = Boolean(selectedSubcategory || selectedColor);

  const grid = (items: Product[], priorityCount = 0) => (
    <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p, i) => (
        <BlushingProductCard
          key={p.id || p.slug || p.name}
          product={p}
          onQuickView={p.slug ? setQuickView : undefined}
          priority={i < priorityCount}
        />
      ))}
    </div>
  );

  return (
    /*
      `overflow-x: clip` (not `hidden`) contains the ambient pools' sideways bleed. `hidden`
      would make this a scroll container and break the fixed navigation; `clip` only clips, and
      leaves the vertical axis visible so the page still scrolls normally.
    */
    <div data-bb-page className={`${blushingFontVars} bg-black font-sans text-white [overflow-x:clip]`}>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative flex min-h-[640px] flex-col overflow-hidden lg:min-h-[804px]">
        <div className="absolute inset-0 z-0">
          {/*
            The hero shows only what an admin uploaded under Category System -> Blushing Blooms.
            It deliberately does NOT read the shared storefront banners: those belong to the home
            page, and borrowing them put the home video on this hero. With nothing uploaded the
            slot stays empty rather than falling back to stock art.
          */}
          {content.heroMedia && <SectionMedia src={content.heroMedia} alt="" priority />}
          {content.heroMedia && (
          <>
          {/*
            No flat scrim. The Figma hero applies none — its render is luminance-identical to the
            raw asset — and a `bg-black/35` multiplied the whole image by 0.65, which is what made
            the florals look muddy and the reds dull.

            What remains is a soft pool centred on the copy rather than a sheet over the picture.
            On the shipped art it is imperceptible (the region behind the headline measures 0.75
            mean luminance — already black), so the hero matches Figma; on a bright image uploaded
            later from the admin it is the only thing keeping the white headline readable.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'radial-gradient(58% 46% at 50% 42%, rgba(0,0,0,0.42), rgba(0,0,0,0) 72%)' }}
          />
          </>
          )}
        </div>

        <BlushingNav />

        <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-10 pt-32 sm:pt-40">
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-jedira text-[34px] leading-tight tracking-[0.1em] text-white sm:text-[48px] lg:text-[64px]">
              {content.heroTitle}
            </h1>
            <p className="max-w-[562px] text-[13px] leading-[1.4] tracking-[0.1em] text-white/50 sm:text-[15px] lg:text-[16px]">
              {content.heroSubtitle}
            </p>
          </div>
        </div>

        {/* Brand pillars — inside the hero on desktop, as the design shows */}
        <div className="relative z-10 px-4 pb-6 sm:px-6 lg:pb-[42px]">
          <ul className="mx-auto grid w-full max-w-[1364px] grid-cols-2 gap-x-6 gap-y-6 rounded-[24px] bg-[rgba(224,91,162,0.2)] px-5 py-6 backdrop-blur-sm sm:gap-x-10 lg:grid-cols-4 lg:gap-x-[40px] lg:px-10">
            {PILLARS.map(({ Icon, label, caption }) => (
              <li key={label} className="flex items-center gap-[9px]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/70 lg:h-10 lg:w-10">
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-[11px] font-medium tracking-[0.1em] text-white/70 lg:text-[14px]">{label}</span>
                  <span className="text-[11px] tracking-[0.1em] text-white/40 lg:text-[14px]">{caption}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------- Secondary banner */}
      <section className="relative w-full overflow-hidden lg:aspect-[1440/630]">
        {/*
          The design overlays the copy on the left of the banner. At 1440 that works; at 390 it
          would crop the photograph to a letterbox and drop the copy on top of its subject. So
          below lg the image becomes its own 3:2 block that fades into the copy beneath it, and
          the overlay composition returns at lg where there is room for it.
        */}
        <div className="relative aspect-[3/2] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto">
          {/* Empty slot until an admin uploads one — never stock art. */}
          {content.bannerMedia && <SectionMedia src={content.bannerMedia} alt="" sizes="100vw" />}
          {/* Two stacked scrims, matching the design's left-hand darkening rectangles. */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black via-black/45 to-transparent lg:block" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/85 to-transparent lg:block lg:w-[42%]" />
          {/* Below lg the photo hands off to the black copy block instead of sitting behind it. */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black to-transparent lg:hidden" />
        </div>

        <div className="relative px-6 pb-14 pt-4 sm:px-10 lg:absolute lg:inset-0 lg:flex lg:items-center lg:px-[140px] lg:py-0">
          <div className="flex max-w-[461px] flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-medium tracking-[0.05em] sm:text-[12px]" style={{ color: '#eb8853' }}>
                  {content.bannerEyebrow}
                </p>
                <h2 className="font-serif text-[30px] font-semibold capitalize leading-[1.15] text-white sm:text-[36px] lg:text-[40px]">
                  {content.bannerTitle}
                  <br />
                  <span style={{ color: ACCENT }}>{content.bannerTitleAccent}</span>
                </h2>
              </div>
              <p className="text-[13px] leading-[1.4] tracking-[0.1em] text-white sm:text-[14px]">
                {content.bannerDescription}
              </p>
            </div>

            <Link
              href={content.bannerCtaHref}
              className="inline-flex h-10 w-[214px] items-center justify-center gap-4 rounded-[24px] text-[12px] font-medium uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOLD }}
            >
              {content.bannerCtaLabel}
              <ChevronDown size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Listing */}
      {/*
        `isolate` keeps the -z-10 pools inside this section's own stacking context, so they sit
        under the cards but still above the page's black background. No `overflow-hidden`: the
        pools are meant to bleed off the edges, and `body { overflow-x: hidden }` in globals.css
        already stops that becoming a horizontal scrollbar.
      */}
      <section
        id="blushing-blooms-products"
        className="relative isolate mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 lg:px-5 lg:py-[60px]"
      >
        {/*
          Alternating left / right / left / right, on the design's own geometry.

          The horizontal offsets are the pool centres sampled from the Figma *render* — x=105,
          1415, 118, and ~1590 on a 1440 canvas. Three sit just inside the edge rather than far
          outside it, which is what gives them their presence; pushing the centres off-canvas
          (the obvious guess) loses nearly all the intensity. The fourth node's declared bounds
          put its centre 710px off-canvas, but the rendered falloff says otherwise — the bounds
          exclude the blur, so the render was trusted over the geometry.

          Vertical offsets are absolute, not percentages: the design spaces these ~1050px apart,
          and a percentage would bunch all four together on a short catalogue and stretch them
          apart on a long one.
        */}
        {/*
          Clipped to this section's own height. The pools sit on the design's fixed vertical
          rhythm, so on a short catalogue the lowest one reached ~2400px past the last product
          and, being absolutely positioned, dragged the document's scroll height with it —
          leaving a long empty tail below the footer.

          `overflow: visible clip` clips the vertical axis only, so the pools still bleed
          sideways to the viewport edge as the design intends.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 [overflow:visible_clip]"
        >
          <Glow className="left-[105px] top-[80px] -translate-x-1/2 -translate-y-1/2" />
          <Glow className="right-[25px] top-[1140px] translate-x-1/2 -translate-y-1/2" />
          <Glow className="left-[118px] top-[2160px] -translate-x-1/2 -translate-y-1/2" />
          <Glow className="right-[-150px] top-[2980px] translate-x-1/2 -translate-y-1/2" />
        </span>
        {/* Filter / sort row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-6 sm:gap-10">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="bb-filters"
              suppressHydrationWarning
              className="flex items-center gap-2 text-[13px] tracking-[0.04em] text-white/70 transition-colors hover:text-white sm:text-[16px]"
            >
              {showFilters ? 'HIDE FILTERS' : 'SHOW FILTERS'}
              <SlidersHorizontal size={20} strokeWidth={1.5} />
            </button>
            <p className="text-[13px] tracking-[0.04em] text-white sm:text-[16px]">
              {visible.length} {visible.length === 1 ? 'PRODUCT' : 'PRODUCTS'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="bb-sort" className="text-[13px] tracking-[0.04em] text-white/70 sm:text-[16px]">
              SORTED BY :
            </label>
            <div className="relative">
              <select
                id="bb-sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                suppressHydrationWarning
                className="w-[180px] cursor-pointer appearance-none rounded-[24px] bg-[#1e1918] py-1.5 pl-4 pr-9 text-[13px] tracking-[0.04em] text-white focus:outline-none sm:w-[200px] sm:text-[16px]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/*
          The design shows the collapsed control only, so this panel is deliberately minimal:
          the same two facets ShopClient derives, as chips. Anything richer would be invented.
        */}
        {showFilters && (
          <div id="bb-filters" className="mb-8 flex flex-col gap-5 rounded-[24px] border border-[rgba(43,43,43,0.8)] bg-[#1e1918] p-5">
            {subcategoryOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[12px] tracking-[0.1em] text-white/40">COLLECTION</span>
                {subcategoryOptions.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSelectedSubcategory((v) => (v === s.key ? '' : s.key))}
                    suppressHydrationWarning
                    aria-pressed={selectedSubcategory === s.key}
                    className={`rounded-full border px-3 py-1 text-[12px] tracking-[0.06em] transition-colors ${
                      selectedSubcategory === s.key
                        ? 'border-transparent bg-[#cc965a] text-white'
                        : 'border-white/20 text-white/70 hover:text-white'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {colorOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[12px] tracking-[0.1em] text-white/40">COLOUR</span>
                {colorOptions.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor((v) => (v === c.name ? '' : c.name))}
                    suppressHydrationWarning
                    aria-pressed={selectedColor === c.name}
                    aria-label={c.name}
                    title={c.name}
                    className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-[#1e1918] transition-shadow ${
                      selectedColor === c.name ? 'ring-2 ring-white' : 'ring-1 ring-white/20'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSubcategory('');
                  setSelectedColor('');
                }}
                suppressHydrationWarning
                className="flex w-fit items-center gap-1.5 text-[12px] tracking-[0.1em] text-white/50 transition-colors hover:text-white"
              >
                <X size={14} /> CLEAR FILTERS
              </button>
            )}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="py-20 text-center text-[14px] tracking-[0.1em] text-white/50">
            No products match this selection yet.
          </p>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {grid(beforeVideo, 3)}

            {/* ------------------------------------------------ Video feature */}
            {/*
              Gated on having media, not on the product count: this is real content, so it shows
              whenever there is something to play. The rule it answers to is "never render an
              empty container" — a section with no media would be one, a section with the film in
              it is not. (The page's earlier empty tail was the ambient pools overrunning the
              content, fixed by the clip above, not this section.)

              It still sits between the first six products and the rest, so with a longer
              catalogue it lands exactly where the design puts it.

              The design's 2:1 box has room for the heading and a full sentence at 1400px wide.
              At 390 it would be 195px tall and the copy would spill out of the rounded frame, so
              the box grows taller as the viewport narrows rather than the text shrinking away.
            */}
            {content.videoMedia && (
            <section className="relative my-10 aspect-[4/5] w-full overflow-hidden rounded-[28px] sm:aspect-[16/9] lg:my-[60px] lg:aspect-[1400/705] lg:rounded-[40px]">
              <SectionMedia src={content.videoMedia} alt="" sizes="(max-width: 1440px) 100vw, 1400px" />
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-8 text-center sm:px-10">
                <h2 className="max-w-[604px] font-serif text-[21px] font-medium capitalize leading-[1.2] text-white sm:text-[32px] lg:text-[40px]">
                  {content.videoTitle}
                  <br />
                  <span style={{ color: ACCENT }}>{content.videoTitleAccent}</span>
                </h2>
                <p className="max-w-[847px] text-[13px] leading-[1.35] tracking-[0.1em] text-white/70 sm:text-[16px] lg:text-[20px]">
                  {content.videoDescription}
                </p>
              </div>
            </section>
            )}

            {afterVideo.length > 0 && grid(afterVideo)}
          </div>
        )}
      </section>

      <BlushingFooter />

      {/*
        The Blushing Blooms quick view. The storefront's QuickViewModal is deliberately not used
        here — it stays exactly as it is for /shop, search and wishlist — but the cart and
        pricing logic underneath both is the same.
      */}
      {quickView && <BlushingQuickView product={quickView} onClose={() => setQuickView(null)} />}
    </div>
  );
}
