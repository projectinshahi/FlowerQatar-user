'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import ProductCard from '../../../components/ProductCard';
import QuickViewModal from '../../../components/QuickViewModal';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { Product } from '../../../types';
import {
  CHILD_FILTER_PARAMS,
  DEFAULT_SORT,
  type ChildFilters,
  type ShopFacets,
} from '../../../lib/shop-facets';

/** Marketing shot used whenever the listing is not narrowed to one subcategory. */
const DEFAULT_HERO_IMAGE = '/images/hero_background_1782286769476.png';

/*
 * Products revealed per "Load More". Was 6, which on the All listing hid whole categories: the
 * default Featured sort puts every best-seller first, so the first Blushing Blooms product sat
 * at position 15 and most at 29-39 — several clicks away, so shoppers never saw them.
 *
 * The full result set is already on the client (see ShopViewProps.products), so a larger page
 * costs no extra request — only more cards, whose images next/image lazy-loads off-screen.
 * 48 shows the whole current catalogue at once; "Load More" still takes over past that, so the
 * page stays light as the catalogue grows.
 */
const PAGE_SIZE = 48;

interface ShopViewProps {
  /** Already scoped, filtered and sorted on the server. The client never re-filters. */
  products: Product[];
  /** Options and counts for the current scope. */
  facets: ShopFacets;
  /** The values that actually survived reconciliation — never the raw query string. */
  filters: ChildFilters;
  /** Params the server refused; stripped from the URL on mount. */
  dropped: string[];
  heroTitle: string;
  /** Active subcategory's banner art; undefined falls back to the marketing shot. */
  heroImage?: string;
}

function ShopContent({ products, facets, filters, dropped, heroTitle, heroImage }: ShopViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  /*
   * THE URL IS THE ONLY FILTER STATE.
   *
   * Subcategory, colour, price and sort used to live in `useState` while category and tab lived
   * in the query string — two lifecycles that never spoke. Because this component is not
   * remounted when the category changes (navigation only hands it a new `products` prop), the
   * local half survived the switch: choosing Red under Flowers and moving to Gift Combos left
   * the colour filter applied while its swatch vanished from the panel, so the grid emptied
   * with nothing to clear. One source of truth removes that class of bug outright, and makes
   * every filter shareable, bookmarkable and reversible with Back.
   */
  const writeParams = useCallback(
    (patch: Record<string, string | number | null>, opts?: { replace?: boolean }) => {
      const next = new URLSearchParams(params.toString());

      // Changing the parent invalidates every child. Sweeping the known set keeps this correct
      // when a facet is added, instead of a delete-list that silently goes stale.
      if ('category' in patch) {
        for (const key of CHILD_FILTER_PARAMS) next.delete(key);
      }

      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, String(value));
      }

      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      // `replace` for corrections the shopper did not make, so Back does not walk through them.
      if (opts?.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [params, pathname, router]
  );

  /*
   * Self-healing links. A pasted or bookmarked URL can carry values that are invalid for its
   * category; the server has already ignored them, and this strips them so the address bar
   * matches what is actually on screen. `replace` keeps it out of the history.
   */
  useEffect(() => {
    if (dropped.length === 0) return;
    const next = new URLSearchParams(params.toString());
    let changed = false;
    for (const key of dropped) {
      if (next.has(key)) {
        next.delete(key);
        changed = true;
      }
      // `collection` is the legacy alias and has to go with its canonical partner.
      if (key === 'subcategory' && next.has('collection')) {
        next.delete('collection');
        changed = true;
      }
    }
    if (!changed) return;
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [dropped, params, pathname, router]);

  const setFilter = (patch: Record<string, string | number | null>) => {
    setVisibleCount(PAGE_SIZE);
    writeParams(patch);
  };

  const clearFilters = () => {
    setVisibleCount(PAGE_SIZE);
    const cleared = Object.fromEntries(CHILD_FILTER_PARAMS.map((k) => [k, null]));
    writeParams(cleared);
  };

  /*
   * Price is the one control with a local mirror, and deliberately: a range input fires on every
   * pixel of the drag, and routing per pixel would be unusable. The draft drives the thumb, the
   * URL is written once on release. `null` means no ceiling, shown at the top of the range.
   */
  const priceMin = facets.price?.min ?? 0;
  const priceMax = facets.price?.max ?? 0;
  const committedPrice = filters.maxPrice ?? priceMax;
  const [priceDraft, setPriceDraft] = useState<number | null>(null);
  const [syncedTo, setSyncedTo] = useState(committedPrice);

  // Drop the draft once the URL catches up, so the thumb follows Back/Forward too. Adjusted
  // DURING RENDER rather than in an effect: React re-runs this component before touching the
  // DOM, so the thumb never paints at the stale position, and it keeps the render pure of the
  // cascading-update problem `react-hooks/set-state-in-effect` exists to catch.
  if (syncedTo !== committedPrice) {
    setSyncedTo(committedPrice);
    setPriceDraft(null);
  }

  const priceCeiling = priceDraft ?? committedPrice;

  const commitPrice = () => {
    if (priceDraft === null) return;
    setFilter({ maxPrice: priceDraft >= priceMax ? null : priceDraft });
  };

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Clamped rather than reset on every prop change: a shorter result set must not keep
  // claiming "Showing 12 of 4".
  const shown = Math.min(visibleCount, products.length);
  const handleLoadMore = () => setVisibleCount((prev) => prev + PAGE_SIZE);

  const openQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const hasActiveFilters =
    !!filters.subcategory ||
    !!filters.country ||
    filters.maxPrice !== null ||
    filters.sort !== DEFAULT_SORT;

  return (
    <div className="w-full mx-auto font-sans text-primary">
      <div className="px-6 pt-8 pb-4">
        <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }]} />
      </div>

      {/*
        Banner. `heroImage` is the active subcategory's admin-managed art; without one this
        falls back to the marketing shot, so the layout is identical either way.

        The scrim is heavier over a real photo: subcategory images are arbitrary uploads and
        the maroon heading can otherwise land on a light area and become unreadable.
      */}
      <div className="relative w-full overflow-hidden border-y border-divider/60 py-20 md:py-32 px-8 text-center mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroImage || DEFAULT_HERO_IMAGE}')` }}
        />
        <div className={`absolute inset-0 ${heroImage ? 'bg-black/45' : 'bg-black/20'}`} />
        <div className="relative z-10">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C1A87D] font-semibold block mb-3">
            Lebami Collection
          </span>
          <h1
            className={`font-serif text-4xl md:text-5xl font-medium tracking-wide mb-4 capitalize ${
              heroImage ? 'text-white drop-shadow-md' : 'text-[#800000]'
            }`}
          >
            {heroTitle}
          </h1>
          <p className="text-xs md:text-sm text-white/95 max-w-md mx-auto leading-relaxed">
            Explore our signature boxes of preserved Eternity® Roses. Handcrafted to order and designed to bloom in your space for a full year.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-divider/40 pb-6 mb-8 mt-4 px-6 md:px-12">
        <button
          onClick={() => { setShowFilters(!showFilters); setIsFilterDrawerOpen(true); }}
          className="flex items-center space-x-2 text-[11px] uppercase tracking-widest text-primary hover:text-secondary transition-colors font-sans font-medium"
        >
          <span>{showFilters ? 'HIDE FILTERS' : 'SHOW FILTERS'}</span>
          <SlidersHorizontal size={14} />
        </button>

        <div className="text-[10px] uppercase tracking-widest text-primary font-medium hidden md:block">
          {products.length} PRODUCTS
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-widest text-primary font-medium">
            <span>SORT BY:</span>
            <select aria-label="Sort products"
              value={filters.sort}
              onChange={(e) => setFilter({ sort: e.target.value === DEFAULT_SORT ? null : e.target.value })}
              className="appearance-none bg-transparent border-none pr-5 text-[11px] uppercase tracking-widest text-primary focus:outline-none focus:ring-0 cursor-pointer"
              suppressHydrationWarning
            >
              <option value="featured">FEATURED</option>
              <option value="price-low-high">PRICE: LOW TO HIGH</option>
              <option value="price-high-low">PRICE: HIGH TO LOW</option>
              <option value="newest">NEWEST</option>
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex w-full overflow-hidden">
        <aside
          className={`hidden lg:block flex-shrink-0 transition-all duration-700 ease-in-out overflow-hidden ${
            showFilters ? 'w-[280px] border-r border-divider/40 opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <div className="flex flex-col border-t border-divider/40 px-6 w-[280px]">
            {facets.subcategories.length > 0 && (
              <div className="border-b border-divider/40 py-5">
                <h4 className="text-[11px] uppercase tracking-[0.2em] font-sans text-primary mb-3">Subcategory</h4>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setFilter({ subcategory: null, collection: null })}
                    className={`flex justify-between text-left text-[12px] py-1 transition-colors ${!filters.subcategory ? 'text-secondary font-semibold' : 'text-muted hover:text-primary'}`}
                  >
                    <span>All Subcategories</span>
                    <span className="tabular-nums">{facets.total}</span>
                  </button>
                  {facets.subcategories.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setFilter({ subcategory: c.value, collection: null })}
                      className={`flex justify-between gap-2 text-left text-[12px] py-1 capitalize transition-colors ${filters.subcategory === c.value ? 'text-secondary font-semibold' : 'text-muted hover:text-primary'}`}
                    >
                      <span className="truncate">{c.label}</span>
                      <span className="tabular-nums">{c.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Country of origin. Only rendered where products are tagged, so it appears under
                Flowers and stays out of the way elsewhere. The "All" row carries no number on
                purpose: origin is optional, so a total here would look like it should sum to
                the scope when most products are simply untagged. */}
            {facets.countries.length > 0 && (
              <div className="border-b border-divider/40 py-5">
                <h4 className="text-[11px] uppercase tracking-[0.2em] font-sans text-primary mb-3">Country of Origin</h4>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setFilter({ country: null })}
                    className={`flex justify-between text-left text-[12px] py-1 transition-colors ${!filters.country ? 'text-secondary font-semibold' : 'text-muted hover:text-primary'}`}
                  >
                    <span>All Countries</span>
                  </button>
                  {facets.countries.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setFilter({ country: c.value })}
                      className={`flex justify-between gap-2 text-left text-[12px] py-1 capitalize transition-colors ${filters.country === c.value ? 'text-secondary font-semibold' : 'text-muted hover:text-primary'}`}
                    >
                      <span className="truncate">{c.label}</span>
                      <span className="tabular-nums">{c.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {facets.price && priceMax > priceMin && (
              <div className="border-b border-divider/40 py-5">
                <div className="flex justify-between text-[11px] uppercase tracking-[0.2em] font-sans text-primary mb-3">
                  <span>Price</span>
                  <span className="text-secondary font-bold">QAR {priceCeiling}</span>
                </div>
                <input
                  type="range"
                  min={priceMin}
                  max={priceMax}
                  step="1"
                  value={priceCeiling}
                  onChange={(e) => setPriceDraft(Number(e.target.value))}
                  onPointerUp={commitPrice}
                  onKeyUp={commitPrice}
                  onBlur={commitPrice}
                  className="w-full accent-gold h-1 bg-divider"
                  aria-label="Maximum price"
                />
              </div>
            )}
          </div>
        </aside>

        <div className="flex-grow transition-all duration-700 ease-in-out">
          {products.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-divider bg-cream rounded-none space-y-4">
              <p className="text-sm text-muted italic">
                {filters.subcategory
                  ? 'No products found in this category.'
                  : 'No items found matching the selected criteria.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-6 py-2.5 bg-secondary hover:bg-secondary-hover text-white text-xs uppercase tracking-widest transition-colors">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid gap-0 border-l border-t border-divider/40 grid-cols-2 lg:grid-cols-3">
                {products.slice(0, shown).map((product, i) => (
                  <ProductCard key={product.slug} product={product} onQuickView={openQuickView} priority={i < 3} showColors={false} />
                ))}
              </div>

              {shown < products.length && (
                <div className="text-center pt-8">
                  <button onClick={handleLoadMore} className="px-8 py-3.5 border border-secondary text-secondary hover:bg-secondary hover:text-white uppercase text-xs tracking-[0.2em] font-semibold transition-colors duration-500 shadow-sm">
                    Load More Arrangements
                  </button>
                  <p className="text-[10px] text-muted uppercase tracking-widest mt-3 font-medium">
                    Showing {shown} of {products.length} arrangements
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div onClick={() => setIsFilterDrawerOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="relative w-full max-w-sm bg-white shadow-2xl p-6 flex flex-col justify-between z-10 overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-divider mb-6">
                <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-primary">Filter Arrangements</h3>
                <button aria-label="Close filters" onClick={() => setIsFilterDrawerOpen(false)} className="text-muted hover:text-primary"><X size={20} /></button>
              </div>
              {facets.subcategories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[10px] uppercase tracking-widest font-semibold text-primary mb-3">Subcategory</h4>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilter({ subcategory: null, collection: null })} className={`px-3 py-1.5 text-[10px] border tracking-wider uppercase ${!filters.subcategory ? 'bg-primary text-white border-primary' : 'border-divider text-muted'}`}>All</button>
                    {facets.subcategories.map((c) => (
                      <button key={c.value} onClick={() => setFilter({ subcategory: c.value, collection: null })} className={`px-3 py-1.5 text-[10px] border tracking-wider uppercase capitalize ${filters.subcategory === c.value ? 'bg-primary text-white border-primary' : 'border-divider text-muted'}`}>{c.label} ({c.count})</button>
                    ))}
                  </div>
                </div>
              )}
              {facets.countries.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[10px] uppercase tracking-widest font-semibold text-primary mb-3">Country of Origin</h4>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilter({ country: null })} className={`px-3 py-1.5 text-[10px] border tracking-wider uppercase ${!filters.country ? 'bg-primary text-white border-primary' : 'border-divider text-muted'}`}>All</button>
                    {facets.countries.map((c) => (
                      <button key={c.value} onClick={() => setFilter({ country: c.value })} className={`px-3 py-1.5 text-[10px] border tracking-wider uppercase capitalize ${filters.country === c.value ? 'bg-primary text-white border-primary' : 'border-divider text-muted'}`}>{c.label} ({c.count})</button>
                    ))}
                  </div>
                </div>
              )}
              {facets.price && priceMax > priceMin && (
                <div className="mb-6">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-semibold mb-3">
                    <span>Price Cap</span>
                    <span className="text-secondary font-bold">QAR {priceCeiling}</span>
                  </div>
                  <input
                    type="range"
                    min={priceMin}
                    max={priceMax}
                    step="1"
                    value={priceCeiling}
                    onChange={(e) => setPriceDraft(Number(e.target.value))}
                    onPointerUp={commitPrice}
                    onKeyUp={commitPrice}
                    onBlur={commitPrice}
                    className="w-full accent-gold h-1 bg-divider"
                    aria-label="Maximum price"
                  />
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-divider flex gap-3">
              <button onClick={clearFilters} className="flex-grow py-3 border border-divider hover:border-primary text-[10px] uppercase tracking-widest transition-colors font-medium text-center">Clear</button>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="flex-grow py-3 bg-primary hover:bg-secondary text-white text-[10px] uppercase tracking-widest font-semibold transition-colors text-center">Apply</button>
            </div>
          </div>
        </div>
      )}

      <QuickViewModal product={selectedProduct} isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} />
    </div>
  );
}

export default function ShopClient(props: ShopViewProps) {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 text-center font-sans text-muted">
        Loading Atelier Collection...
      </div>
    }>
      <ShopContent {...props} />
    </Suspense>
  );
}
