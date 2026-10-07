'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Flower2, Gem, Gift, Heart, SlidersHorizontal, X } from 'lucide-react';
import LuxuryImage from '@/components/LuxuryImage';
import { paginateListing } from '@/lib/shop-facets';
import BlushingQuickView from './BlushingQuickView';
import BlushingNav from './BlushingNav';
import BlushingFooter from './BlushingFooter';
import BlushingProductCard from './BlushingProductCard';
import { blushingFontVars } from './fonts';
import { BlushingBackButton, GOLD, Glow } from './ui';
import type { BlushingBloomsContent } from '@/data/blushing-blooms';
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

/**
 * One page is two runs of six with the video between them — the Figma layout at both
 * breakpoints, since 6 is 2 rows of 3 on desktop and 3 rows of 2 on mobile. Anything past the
 * twelfth product moves to page 2 rather than extending the page indefinitely.
 */
const PRODUCTS_PER_PAGE = PRODUCTS_BEFORE_VIDEO * 2;

const ACCENT = '#e05ba2';


/**
 * One end of the pagination control. Split out only because it is used twice and disabling it
 * correctly is three attributes; it is not a new design — the gold border and uppercase tracking
 * are the page's existing button language, and the Prev / n-of-total / Next shape is the admin
 * product table's.
 */
function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label} page`}
      suppressHydrationWarning
      className="flex h-9 items-center gap-1.5 rounded-[24px] border border-[rgba(204,150,90,0.35)] px-4 transition-colors hover:border-[rgba(204,150,90,0.8)] hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/**
 * Background media for a section. A single url may be an image or a video; LuxuryImage reads
 * the type through isVideoMedia() and plays a clip only while it is on screen.
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
  return <LuxuryImage src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
}

/**
 * One labelled filter dropdown.
 *
 * A native `<select>`, not a custom popup: it is the control the SORTED BY row beside it
 * already uses, it costs no library, and on a phone it opens the OS picker — the most compact
 * and the most usable thing a filter row can do on a small screen. `[data-bb-page] select` in
 * globals.css already themes it dark, so it matches the sort control without extra styling.
 *
 * Semantics are unchanged from the chips this replaces: one value at a time, and the blank
 * option is the "no filter" state the empty string already meant.
 *
 * `swatch` paints the chosen colour inside the closed control. A native option list cannot
 * show one, and without it the colour filter would read as plain text where the design has dots.
 */
function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  allLabel,
  swatch,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
  swatch?: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor={id} className="shrink-0 text-[12px] tracking-[0.1em] text-white/40">
        {label}
      </label>
      {/* Grows to fill the row when the panel stacks on mobile; fixed width once it goes
          horizontal at sm, so the two dropdowns line up. */}
      <div className="relative min-w-0 flex-1 sm:flex-none">
        {swatch && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full ring-1 ring-white/25"
            style={{ backgroundColor: swatch }}
          />
        )}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          suppressHydrationWarning
          className={`w-full min-w-0 cursor-pointer appearance-none rounded-[24px] bg-[#1e1918] py-1.5 pr-9 text-[13px] tracking-[0.04em] text-white focus:outline-none sm:w-[180px] sm:text-[16px] ${
            swatch ? 'pl-9' : 'pl-4'
          }`}
        >
          <option value="">{allLabel}</option>
          {options.map((o) => (
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
  );
}

/**
 * The SORTED BY control: a custom listbox, not a native `<select>`.
 *
 * The filter dropdowns beside it are still native, deliberately — on a phone they open the OS
 * picker, which is the most usable thing a filter row can do on a small screen, and a native
 * option list costs nothing to make accessible. This one is custom because a native option list
 * cannot be styled: it paints with the OS chrome, so it could not carry the page's translucent
 * gold-on-dark surface or mark the current choice with a tick.
 *
 * Everything the native element gave away for free is therefore rebuilt here, and the list is
 * not merely decorative markup:
 *
 *  - `role="listbox"` / `role="option"` with `aria-selected`, so it is announced as a choice,
 *  - full keyboard control — Up/Down/Home/End move, Enter/Space choose, Escape closes,
 *  - `aria-activedescendant`, so a screen reader follows the highlight without focus moving,
 *  - focus returns to the trigger on close, so Tab order is never lost inside a closed popup,
 *  - outside click and Escape both dismiss.
 *
 * The panel stays mounted and animates on opacity/translate rather than being conditionally
 * rendered, because an element removed from the tree cannot animate out — only in. It is
 * `aria-hidden` and `pointer-events-none` while closed, so it is neither clickable nor
 * announced.
 */
function SortMenu({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedIndex = Math.max(0, SORT_OPTIONS.findIndex((o) => o.value === value));
  const current = SORT_OPTIONS[selectedIndex];

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Dismiss on a click anywhere outside the control. `mousedown`, not `click`, so the menu is
  // gone before the click lands on whatever was underneath.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Move real focus into the list so the arrow keys reach it.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(SORT_OPTIONS[index].value);
    close();
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    const last = SORT_OPTIONS.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActiveIndex((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActiveIndex((i) => Math.max(0, i - 1)),
      Home: () => setActiveIndex(0),
      End: () => setActiveIndex(last),
      Enter: () => choose(activeIndex),
      ' ': () => choose(activeIndex),
      Escape: () => close(),
      Tab: () => close(false),
    };
    const run = keys[e.key];
    if (!run) return;
    // Tab must still move focus onward; every other key here is ours to swallow.
    if (e.key !== 'Tab') e.preventDefault();
    run();
  };

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1 sm:flex-none">
      <button
        ref={triggerRef}
        type="button"
        id="bb-sort"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="bb-sort-label bb-sort"
        onClick={() => (open ? close(false) : openAt(selectedIndex))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openAt(selectedIndex);
          }
        }}
        suppressHydrationWarning
        className="flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[24px] border border-[rgba(204,150,90,0.22)] bg-[#1e1918] py-2 pl-4 pr-3 text-left text-[13px] tracking-[0.04em] text-white transition-colors hover:border-[rgba(204,150,90,0.5)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(204,150,90,0.7)] sm:w-[200px] sm:py-1.5 sm:text-[16px]"
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-white transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/*
        Anchored to the trigger's right edge, and 244px wide rather than matched to the trigger:
        the longest label, "PRICE: LOW TO HIGH", measures 161px and the row's own chrome (panel
        padding, option padding, tick slot and its gap) costs 62px, so a panel tied to the 200px
        trigger clipped it by three pixels. Right-aligned with a viewport-relative cap, so it
        still cannot run off a phone — at 390px it reaches x130, well inside the gutter. The
        listing section is `overflow-x: clip` with the vertical axis left visible — chosen for
        the ambient pools — so a panel hanging below the row is not clipped.
      */}
      <div
        ref={listRef}
        role="listbox"
        tabIndex={-1}
        aria-hidden={!open}
        aria-activedescendant={open ? `bb-sort-opt-${activeIndex}` : undefined}
        onKeyDown={onListKeyDown}
        className={`absolute right-0 top-[calc(100%+8px)] z-30 w-[244px] max-w-[calc(100vw-2rem)] origin-top rounded-[20px] border border-[rgba(204,150,90,0.25)] bg-[rgba(20,17,13,0.82)] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-200 ease-out focus:outline-none ${
          open ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0'
        }`}
      >
        {SORT_OPTIONS.map((o, i) => {
          const isSelected = o.value === current.value;
          return (
            <div
              key={o.value}
              id={`bb-sort-opt-${i}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => choose(i)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex cursor-pointer items-center gap-2 rounded-[14px] px-3 py-2 text-[13px] tracking-[0.04em] transition-colors sm:text-[14px] ${
                isSelected ? 'text-white' : 'text-white/65'
              } ${activeIndex === i ? 'bg-[rgba(204,150,90,0.14)] text-white' : ''}`}
            >
              {/* Fixed slot, so every label starts on the same x whether or not it is ticked. */}
              <span className="flex w-4 shrink-0 justify-center">
                {isSelected && <Check size={14} strokeWidth={2.5} style={{ color: GOLD }} aria-hidden="true" />}
              </span>
              <span className="truncate">{o.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Dual-handle price slider.
 *
 * Two native `<input type="range">` stacked on one track, rather than a slider library or a
 * hand-rolled pointer-drag: each handle is then a real slider to the browser, which brings
 * touch dragging, arrow/Home/End keys and the announced value with it, and adds no dependency.
 *
 * The stacking is what needs care, and it is handled in globals.css — both inputs cover the
 * full width, so the upper one's track would otherwise swallow every drag aimed at the lower
 * handle. `.bb-range` turns pointer events off across the input and back on for the thumb
 * alone, leaving only the two handles hittable.
 *
 * Handles clamp against each other instead of swapping, so the low value can never exceed the
 * high one and the selected span cannot invert.
 */
function PriceRangeFilter({
  floor,
  ceil,
  low,
  high,
  onChange,
}: {
  floor: number;
  ceil: number;
  low: number;
  high: number;
  onChange: (range: [number, number]) => void;
}) {
  const span = ceil - floor;
  const pct = (v: number) => ((v - floor) / span) * 100;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <label htmlFor="bb-filter-price-min" className="shrink-0 text-[12px] tracking-[0.1em] text-white/40">
        PRICE
      </label>

      <div className="relative h-4 min-w-0 flex-1 sm:w-[180px] sm:flex-none">
        {/* Unselected track */}
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/15" />
        {/* Selected span, in the page gold */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#cc965a]"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        <input
          id="bb-filter-price-min"
          type="range"
          className="bb-range absolute inset-0 h-4 w-full"
          min={floor}
          max={ceil}
          value={low}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
          aria-label="Minimum price"
          suppressHydrationWarning
        />
        <input
          type="range"
          className="bb-range absolute inset-0 h-4 w-full"
          min={floor}
          max={ceil}
          value={high}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
          aria-label="Maximum price"
          suppressHydrationWarning
        />
      </div>

      <output
        htmlFor="bb-filter-price-min"
        className="shrink-0 whitespace-nowrap text-[12px] tracking-[0.04em] text-white/70"
      >
        QAR {low} &ndash; {high}
      </output>
    </div>
  );
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
  /*
   * Price range, or null for "the whole range".
   *
   * Null rather than seeding the bounds into state: the bounds are derived from the products
   * on the page, so a seeded pair would have to be re-synced every time that set changed, and
   * "untouched" would be indistinguishable from "dragged back to the ends". Null makes the
   * unfiltered state explicit — it is what CLEAR FILTERS restores and what `hasFilters` tests.
   */
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [sortOption, setSortOption] = useState<string>('featured');
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [page, setPage] = useState(1);

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

  /*
   * Slider bounds, from every product on the page — the same rule the other two facets follow,
   * so narrowing by colour never shrinks the track under the handles mid-drag. Rounded outwards
   * so the extremes are always reachable at a step of 1.
   */
  const [priceFloor, priceCeil] = useMemo(() => {
    if (products.length === 0) return [0, 0];
    const prices = products.map((p) => p.price);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  // A single-price catalogue has nothing to drag between, so the control is hidden entirely.
  const hasPriceRange = priceCeil > priceFloor;
  const [priceLow, priceHigh] = priceRange ?? [priceFloor, priceCeil];

  const visible = useMemo(() => {
    let result = products.filter(
      (p) =>
        (!selectedSubcategory || p.collection === selectedSubcategory) &&
        (!selectedColor || p.colors?.some((c) => c.name === selectedColor)) &&
        (!priceRange || (p.price >= priceRange[0] && p.price <= priceRange[1]))
    );
    if (sortOption === 'price-low-high') result = [...result].sort((a, b) => a.price - b.price);
    else if (sortOption === 'price-high-low') result = [...result].sort((a, b) => b.price - a.price);
    else if (sortOption === 'newest') result = [...result].reverse();
    // 'featured' deliberately does NOT re-sort: the products arrive in the order the admin's
    // own listing defines (getStoreProducts returns newest-first, matching the admin product
    // table's default). Sorting by best-seller here meant reordering products in the admin had
    // no visible effect on the storefront.
    return result;
  }, [products, selectedSubcategory, selectedColor, priceRange, sortOption]);

  /*
   * The listing is: six products, the video feature, six products, then pagination.
   *
   * The two runs are one page of twelve rather than the whole catalogue. Before this the page
   * rendered `slice(PRODUCTS_BEFORE_VIDEO)` with no end index, so a large catalogue produced a
   * single unbounded column of cards below the video. `paginateListing` also clamps the page
   * number, which is what keeps a filter narrowing the results from stranding the reader on a
   * page that no longer exists. It is covered by tests/blushing-listing.test.ts.
   */
  const { page: currentPage, totalPages, before: beforeVideo, after: afterVideo } =
    paginateListing(visible, page, PRODUCTS_PER_PAGE, PRODUCTS_BEFORE_VIDEO);
  const hasFilters = Boolean(selectedSubcategory || selectedColor || priceRange);

  /*
   * Back to page 1 whenever the result set itself changes. Without this, changing a filter while
   * on page 2 leaves the reader on page 2 of a different set of products — the clamp in
   * `paginateListing` saves them from an empty grid, but page 1 is what they actually expect.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [selectedSubcategory, selectedColor, priceRange, sortOption]);

  /*
   * Paging from the control at the foot of the list would otherwise leave the viewport at the
   * bottom of the page, looking at the LAST row of the new page. The listing section already
   * carries the id the nav links to, so there is nothing new to hold a ref to.
   */
  const goToPage = (next: number) => {
    setPage(next);
    document.getElementById('blushing-blooms-products')?.scrollIntoView({ behavior: 'smooth' });
  };

  const grid = (items: Product[], priorityCount = 0) => (
    <div className="grid grid-cols-2 gap-x-[10px] gap-y-[18px] sm:gap-x-[18px] sm:gap-y-[30px] lg:grid-cols-3">
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
      {/*
        Full viewport, replacing two fixed floors (640px / 804px) that were shorter than most
        laptops and taller than a landscape phone.

        `min-h-screen` is the 100vh fallback and the `supports-[min-height:100dvh]` variant
        overrides it where `dvh` exists — Tailwind emits variants after base utilities, so the
        cascade resolves in that order. This was a hand-written rule in globals.css first;
        Lightning CSS dropped it from the bundle entirely (every neighbouring rule survived),
        so it silently never applied and the section kept collapsing to its content height.

        `dvh` matters on mobile: `vh` is pinned to the LARGEST viewport, so with the URL bar
        showing a 100vh hero is taller than the screen and pushes the feature strip under the
        fold. `min-h-`, never `h-`: a landscape phone is shorter than this content, and a fixed
        height would clip the strip rather than let the section grow.

        Everything inside is placed by the flex column below — the copy takes the free space and
        the strip sits at the end — rather than by hard top offsets.
      */}
      <section className="relative flex w-full flex-col overflow-hidden min-h-screen supports-[min-height:100dvh]:min-h-[100dvh]">
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
        <BlushingBackButton href="/" label="Back to home" />

        {/*
          `flex-1` + centring does the positioning. The top padding only has to clear the fixed
          nav, so it is expressed against viewport height rather than as the old flat pt-32/40.
        */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-[clamp(1rem,4vw,2rem)] pb-[clamp(1.5rem,4vh,2.5rem)] pt-[clamp(6rem,14vh,10rem)]">
          <div className="flex flex-col items-center gap-3 text-center">
            {/* 32px -> 64px, tracking the viewport instead of jumping at two breakpoints. */}
            <h1 className="font-jedira text-[clamp(2rem,6vw,4rem)] leading-tight tracking-[0.1em] text-white">
              {content.heroTitle}
            </h1>
            <p className="max-w-[min(100%,35.125rem)] text-[clamp(0.8125rem,1.4vw,1rem)] leading-[1.4] tracking-[0.1em] text-white/50">
              {content.heroSubtitle}
            </p>
          </div>
        </div>

        {/* Brand pillars — inside the hero on desktop, as the design shows */}
        <div className="relative z-10 px-[clamp(1rem,3vw,1.5rem)] pb-[clamp(1.5rem,4vh,2.625rem)]">
          <ul className="mx-auto grid w-full max-w-[1364px] grid-cols-2 gap-x-6 gap-y-6 rounded-[24px] bg-[rgba(224,91,162,0.2)] px-5 py-6 backdrop-blur-sm sm:gap-x-10 lg:grid-cols-4 lg:gap-x-[40px] lg:px-10">
            {PILLARS.map(({ Icon, label, caption }) => (
              <li key={label} className="flex items-center gap-[9px]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/70 lg:h-10 lg:w-10">
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-[clamp(0.6875rem,1vw,0.875rem)] font-medium tracking-[0.1em] text-white/70">{label}</span>
                  <span className="text-[clamp(0.6875rem,1vw,0.875rem)] tracking-[0.1em] text-white/40">{caption}</span>
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 pb-6 sm:justify-between sm:gap-4">
          {/*
            From sm up: three columns, not two groups. The count is its own child between them,
            and both side groups are `flex-1` from a zero basis so they claim equal width
            whatever their contents measure — "SHOW FILTERS" on the left is nothing like
            "SORTED BY :" plus a 200px select on the right. That equality is what puts the count
            on the section's true midpoint; sitting it between two auto-width groups would only
            ever centre it between them, which is visibly off.

            Below sm the same three children reflow into two rows — the two CONTROLS together,
            then the count as a quiet result line under them:

              SHOW FILTERS ⇄ [ FEATURED ▾ ]
              13 PRODUCTS

            `order` does the rearranging, not a second copy of the markup, so there is one
            filter button and one select at every width. The count takes `w-full`, which is what
            forces the wrap at a predictable place instead of letting the row break wherever the
            text happens to run out — the unstructured look this replaces.
          */}
          <div className="order-1 flex shrink-0 items-center sm:flex-1">
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
          </div>

          <p className="order-3 w-full text-[13px] tracking-[0.04em] text-white sm:order-2 sm:w-auto sm:text-[16px]">
            {visible.length} {visible.length === 1 ? 'PRODUCT' : 'PRODUCTS'}
          </p>

          <div className="order-2 flex flex-1 items-center justify-end gap-2 sm:order-3">
            {/*
              `sr-only` below sm, not removed: row one has ~223px left beside SHOW FILTERS, and
              spending 86px of it on the words leaves too little for "PRICE: LOW TO HIGH" to
              render without truncating. Hiding it visually while keeping the element preserves
              the `htmlFor` association, so the select is still announced as the sort control.
            */}
            {/*
              A <span>, not a <label>: the control it names is a button, and `htmlFor` only
              binds to a form element. The button carries `aria-labelledby` pointing here plus
              at itself, so it is announced as "SORTED BY : FEATURED" rather than either half.
            */}
            <span id="bb-sort-label" className="sr-only text-[13px] tracking-[0.04em] text-white/70 sm:not-sr-only sm:text-[16px]">
              SORTED BY :
            </span>
            <SortMenu value={sortOption} onChange={setSortOption} />
          </div>
        </div>

        {/*
          The design shows the collapsed control only, so this panel is deliberately minimal:
          the same two facets ShopClient derives, one dropdown each. Anything richer would be
          invented.
        */}
        {showFilters && (
          <div
            id="bb-filters"
            /*
              The same glass BlushingNav is built from, layer for layer: a dark tint over a
              10px blur with saturation lifted (blurring drains colour), a hairline border, and
              the same lifted shadow. It replaces a flat `#1e1918` slab, which read as a grey
              card dropped on the page rather than part of it — and, being opaque, hid the gold
              ambient glows behind the listing instead of diffusing them.

              `relative isolate` gives the two sheen layers below a stacking context of their
              own, so their `-z-10` puts them behind the controls without escaping this box.
            */
            className="relative isolate mb-8 flex flex-col gap-x-8 gap-y-4 rounded-[24px] border border-white/20 bg-black/20 p-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)] backdrop-blur-[10px] backdrop-saturate-150 sm:flex-row sm:flex-wrap sm:items-center"
          >
            {/* Sheen: brightest at the top, gone by halfway down. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 rounded-[24px] bg-gradient-to-b from-white/[0.10] via-white/[0.03] to-transparent"
            />
            {/* Lit top edge, faded at both ends so it never looks like a drawn border. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
            />
            {subcategoryOptions.length > 0 && (
              <FilterSelect
                id="bb-filter-collection"
                label="COLLECTION"
                value={selectedSubcategory}
                onChange={setSelectedSubcategory}
                options={subcategoryOptions.map((s) => ({ value: s.key, label: s.name }))}
                allLabel="ALL COLLECTIONS"
              />
            )}

            {colorOptions.length > 0 && (
              <FilterSelect
                id="bb-filter-colour"
                label="COLOUR"
                value={selectedColor}
                onChange={setSelectedColor}
                options={colorOptions.map((c) => ({ value: c.name, label: c.name }))}
                allLabel="ALL COLOURS"
                swatch={colorOptions.find((c) => c.name === selectedColor)?.hex ?? null}
              />
            )}

            {hasPriceRange && (
              <PriceRangeFilter
                floor={priceFloor}
                ceil={priceCeil}
                low={priceLow}
                high={priceHigh}
                /* Dragging back to both ends is not a filter — normalising to null there keeps
                   CLEAR FILTERS from offering to clear a range that selects everything. */
                onChange={(range) =>
                  setPriceRange(range[0] === priceFloor && range[1] === priceCeil ? null : range)
                }
              />
            )}

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSubcategory('');
                  setSelectedColor('');
                  setPriceRange(null);
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

            {/* ------------------------------------------------ Pagination */}
            {/*
              The admin product table's control, in this page's own skin: PREV, the current page
              over the total, NEXT, with both ends disabled rather than hidden so the row does not
              change width as you move through it. Same semantics too — `aria-current="page"` on
              the counter, a labelled `nav` around it.

              Client state, not `?page=` in the URL. The admin table is a server component whose
              page really does live in the URL; here the subcategory, colour, price and sort
              filters are all React state, so a URL page number would desync from them the first
              time a filter changed. It is hidden entirely at one page, where it would be inert.
            */}
            {totalPages > 1 && (
              <nav
                aria-label="Product pages"
                className="flex items-center justify-center gap-2 pt-6 text-[12px] tracking-[0.1em] text-white/70 lg:pt-10"
              >
                <PageButton
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  label="Prev"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                  PREV
                </PageButton>
                <span className="px-3 tabular-nums text-white" aria-current="page">
                  {currentPage} / {totalPages}
                </span>
                <PageButton
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  label="Next"
                >
                  NEXT
                  <ChevronRight size={16} strokeWidth={1.5} />
                </PageButton>
              </nav>
            )}
          </div>
        )}
      </section>

      <BlushingFooter />

      {/*
        The Blushing Blooms quick view. The storefront's QuickViewModal is deliberately not used
        here — it stays exactly as it is for /shop, search and wishlist — but the cart and
        pricing logic underneath both is the same.
      */}
      {/*
        Always rendered, never gated on `quickView`.

        A `{quickView && ...}` guard tears the dialog out on the same tick the state clears, so
        the close animation never gets a frame to run. The component itself renders nothing until
        it has had a product, and owns its own exit.
      */}
      <BlushingQuickView product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
