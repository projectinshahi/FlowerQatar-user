'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Link from 'next/link';
import Image from 'next/image';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const lowerQuery = query.toLowerCase();
      const filtered = PRODUCTS.filter((product) => 
        product.name.toLowerCase().includes(lowerQuery) || 
        product.collection.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  // Clear query when drawer closes
  useEffect(() => {
    if (!isSearchOpen) {
      setTimeout(() => setQuery(''), 300);
    }
  }, [isSearchOpen]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
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
                <button
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
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="SEARCH HERE..."
                        className="w-full bg-transparent outline-none text-[11px] md:text-[12px] uppercase tracking-widest placeholder:text-black/60 focus:ring-0 px-3 md:px-4 h-full min-w-0"
                        autoFocus
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (query.length > 0) setQuery('');
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
                            <Link 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                setQuery(item);
                              }}
                              className="font-serif text-[16px] md:text-[17px] text-primary hover:text-[#C1A87D] transition-colors"
                            >
                              {item}
                            </Link>
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
                        RESULTS FOR "{query}"
                      </h3>
                      
                      {results.length > 0 ? (
                        <div className="flex flex-col space-y-5 md:space-y-6">
                          {results.map((product) => (
                            <Link 
                              href={`/products/${product.slug}`} 
                              key={product.id}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center group"
                            >
                              <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] bg-[#F8F8F8] flex-shrink-0 relative overflow-hidden">
                                <Image 
                                  src={product.image} 
                                  alt={product.name} 
                                  fill 
                                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                              </div>
                              <div className="ml-3 md:ml-4 flex flex-col flex-1 min-w-0">
                                <span className="font-serif text-base md:text-lg text-primary group-hover:text-[#C1A87D] transition-colors truncate">{product.name}</span>
                                <span className="font-sans text-[10px] md:text-[11px] text-[#888] tracking-widest uppercase mt-1">${product.price}</span>
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
