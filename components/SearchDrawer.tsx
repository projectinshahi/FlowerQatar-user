'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useDialogA11y } from '../hooks/useDialogA11y';
import Link from 'next/link';
import LuxuryImage from '@/components/LuxuryImage';
import { Product } from '../types';
import { SearchResultSkeleton } from '@/components/skeletons/ProductSkeletons';

const TOP_SEARCHES = [
  'Hydrangeas',
  'Summer Flowers',
  'Birthday Gifts',
  'Graduation Gifts',
  'Dahlias',
  'Roses',
  'Hat Boxes',
  'Peonies',
  'Spring Colors',
  'Flower Frames'
];

export default function SearchDrawer() {
  const { isSearchOpen, setSearchOpen } = useApp();
  const dialogRef = useDialogA11y<HTMLDivElement>(isSearchOpen, () => setSearchOpen(false));
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  /** Every query change goes through here: an empty query clears, anything else starts loading. */
  const changeQuery = (next: string) => {
    setQuery(next);
    if (next.trim().length === 0) {
      setResults([]);
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  // Debounced backend search.
  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await res.json();
        if (data?.success) setResults(data.data as Product[]);
      } catch (err) {
        if (!(err instanceof Error && err.name === 'AbortError')) console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  /*
   * Focus the field without letting the browser scroll it into view.
   *
   * This replaces `autoFocus`, which is what made the drawer appear to open instantly while
   * closing stayed smooth. The panel enters at `translateX(100%)` — off to the right, inside a
   * `fixed inset-0 overflow-hidden` box. `overflow: hidden` is still programmatically
   * scrollable, so focusing a control inside that off-screen panel made the browser scroll it
   * into view: the container's scrollLeft jumped and the panel was simply *there*, with the
   * spring still running behind a view that had already arrived. Closing has no focus event,
   * which is why only one direction looked wrong.
   *
   * `preventScroll` keeps the caret behaviour identical and lets the same spring play out in
   * both directions.
   */
  useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus({ preventScroll: true });
  }, [isSearchOpen]);

  // Clear query when drawer closes
  useEffect(() => {
    if (!isSearchOpen) {
      setTimeout(() => {
        setQuery('');
        setResults([]);
        setLoading(false);
      }, 300);
    }
  }, [isSearchOpen]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          {/*
            No `transition-opacity` class here any more: Framer writes `opacity` inline on every
            frame, and a CSS transition on the same property tries to ease each of those writes,
            so the two fought and the fade stuttered. One owner, one explicit tween, same curve
            and duration both ways.
          */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col rounded-none"
            >
              {/* Header */}
              <div className="px-5 md:px-6 py-4 bg-[#F8F8F8] flex items-center justify-start border-b border-[#EAEAEA]">
                <button aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                  className="text-primary hover:text-secondary transition-colors rounded-none mr-4"
                >
                  <X size={22} className="stroke-[1.2]" />
                </button>
                <h2 className="text-xs uppercase tracking-[0.15em] font-medium text-primary">SEARCH</h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-white px-5 md:px-8 py-8 md:py-12">
                
                {/* Search Input Area */}
                <div className="mb-10 md:mb-12 relative w-full">
                  <div className="flex items-stretch w-full h-[42px]">
                    <div className="flex-1 border border-black flex items-center min-w-0">
                      <input aria-label="Search products"
                        type="text"
                        value={query}
                        onChange={(e) => changeQuery(e.target.value)}
                        placeholder="SEARCH HERE..."
                        ref={inputRef}
                        className="w-full bg-transparent outline-none text-[11px] md:text-[12px] uppercase tracking-widest placeholder:text-black/60 focus:ring-0 px-3 md:px-4 h-full min-w-0"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (query.length > 0) changeQuery('');
                      }}
                      className="flex items-center justify-center px-3 md:px-4 text-black hover:text-[#C1A87D] transition-colors h-full flex-shrink-0"
                    >
                      {query.length > 0 ? (
                        <X size={20} className="stroke-[1.5]" />
                      ) : (
                        <Search size={20} className="stroke-[1.5]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Results / Top Searches */}
                <div className="flex flex-col">
                  {query.trim().length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col"
                    >
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-primary mb-5 md:mb-6">TOP SEARCHES</h3>
                      <ul className="flex flex-col space-y-4">
                        {TOP_SEARCHES.map((item, idx) => (
                          <li key={idx}>
                            {/* Fills the search box — an action, not navigation, so a button. */}
                            <button
                              type="button"
                              onClick={() => changeQuery(item)}
                              className="text-left font-serif text-[16px] md:text-[17px] text-primary hover:text-[#C1A87D] transition-colors"
                            >
                              {item}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col"
                    >
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-primary mb-5 md:mb-6 truncate">
                        RESULTS FOR &quot;{query}&quot;
                      </h3>
                      
                      {loading ? (
                        // Result-shaped placeholders instead of a "Searching…" line, so the
                        // drawer keeps its height and the real rows drop straight in.
                        <SearchResultSkeleton count={4} />
                      ) : results.length > 0 ? (
                        <div className="flex flex-col space-y-5 md:space-y-6">
                          {results.map((product) => (
                            <Link 
                              href={`/product/${product.slug}`} 
                              key={product.id}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center group"
                            >
                              <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] bg-[#F8F8F8] flex-shrink-0 relative overflow-hidden">
                                <LuxuryImage 
                                  src={product.image} 
                                  alt={product.name} 
                                  fill sizes="70px" 
                                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                              </div>
                              <div className="ml-3 md:ml-4 flex flex-col flex-1 min-w-0">
                                <span className="font-serif text-base md:text-lg text-primary group-hover:text-[#C1A87D] transition-colors truncate">{product.name}</span>
                                <span className="font-sans text-[10px] md:text-[11px] text-[#888] tracking-widest uppercase mt-1">QAR {product.price}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <p className="font-serif text-base md:text-lg text-[#888]">No results found.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
