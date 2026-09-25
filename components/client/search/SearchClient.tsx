'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Product } from '../../../types';
import ProductCard from '../../../components/ProductCard';
import Breadcrumbs from '../../../components/Breadcrumbs';

/**
  * The query arrives as a prop from the server component, which reads ?q= itself.
  *
  * It used to come from useSearchParams(), which is only readable in the browser: this page
  * prerendered to nothing but its "Searching Atelier..." Suspense fallback, and the entire
  * result grid appeared after hydration, shoving the rest of the page down — a layout shift of
  * 0.66 where 0.1 is the threshold for "good". Reading it on the server means the results are
  * in the HTML, so there is nothing left to move. /shop already sources its filters this way.
  */
export default function SearchClient({ products, query: queryParam }: { products: Product[]; query: string }) {
  const [query, setQuery] = useState(queryParam);

  /*
   * Derived while rendering, not assigned from an effect.
   *
   * As an effect this component's first paint had no results in it at all — the grid appeared
   * one render later and shoved everything under it down the page, measured as a layout shift
   * of 0.66 (0.1 is the threshold for "good"). The filter is a pass over a catalogue of a few
   * dozen products held in memory, so there was never a reason to defer it; computing it here
   * means the results are in the very first paint and nothing moves.
   */
  const { results, hasSearched } = useMemo(() => {
    const q = queryParam.trim().toLowerCase();
    if (!q) return { results: [] as Product[], hasSearched: false };
    return {
      results: products.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.collectionName ?? '').toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.colors.some((c) => c.name.toLowerCase().includes(q))
      ),
      hasSearched: true,
    };
  }, [queryParam, products]);

  /*
   * The input is a field the visitor types into, so it stays state — but it has to follow the
   * URL when that changes under it (Back/Forward, or a link to another query). Adjusted here
   * during rendering rather than from an effect: React re-runs this component immediately with
   * the new value, before anything is painted, so there is no frame showing the old text.
   */
  const [seededFrom, setSeededFrom] = useState(queryParam);
  if (seededFrom !== queryParam) {
    setSeededFrom(queryParam);
    setQuery(queryParam);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pb-8 page-below-header font-sans text-primary">
      <Breadcrumbs items={[{ label: 'Search Results', href: '/search' }]} />

      <div className="max-w-xl mx-auto text-center my-12">
        <h1 className="font-serif text-3xl font-medium tracking-wide mb-6">Search Atelier</h1>
        <form onSubmit={handleSearchSubmit} className="relative flex border-b border-secondary pb-2">
          <input aria-label="Search products"
            type="text"
            placeholder="Search arrangements, color swatches..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base md:text-lg font-serif text-primary placeholder-gray/60 bg-transparent border-none focus:outline-none pr-10"
            suppressHydrationWarning
          />
          <button aria-label="Search" type="submit" className="absolute right-0 top-1/2 transform -translate-y-1/2 text-secondary">
            <Search size={20} />
          </button>
        </form>
      </div>

      {hasSearched ? (
        <div>
          {results.length > 0 ? (
            <div className="space-y-8">
              <div className="flex flex-col border-b border-divider pb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-1">Atelier Discovery</span>
                <h2 className="text-sm uppercase tracking-widest text-primary font-medium">
                  We found {results.length} arrangement{results.length > 1 ? 's' : ''} for &quot;{queryParam}&quot;
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
                {results.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-16 animate-in fade-in duration-300">
              <div className="text-center py-16 bg-cream border border-divider/60 rounded-none space-y-4 max-w-2xl mx-auto">
                <p className="text-sm text-muted italic">No arrangements matched &quot;{queryParam}&quot;.</p>
                <p className="text-xs text-muted/80 max-w-sm mx-auto leading-relaxed">
                  Try adjusting filters or searching for terms like &quot;Roses&quot;, &quot;Orchid&quot;, &quot;Lily&quot;, or a color.
                </p>
              </div>
              {bestSellers.length > 0 && (
                <div>
                  <h3 className="font-serif text-2xl text-primary text-center mb-10 tracking-wide">Atelier Best Sellers</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {bestSellers.map((product) => (
                      <ProductCard key={product.slug} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-muted italic">
          Enter a search phrase above to browse the preserved catalog.
        </div>
      )}
    </div>
  );
}

