'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, ShoppingBag, Menu, X, Heart, ChevronRight } from 'lucide-react';
import Image from './LuxuryImage';
import { useApp } from '../context/AppContext';
import { PRODUCTS } from '../data/products';

export default function Header() {
  const pathname = usePathname();
  const { getCartCount, setCartOpen, toggleWishlist, wishlist } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  
  // Search Overlay
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<typeof PRODUCTS>([]);
  
  // Mobile Menu Overlay
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Monitor scroll for header background opacity change
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    // Always solid white background if not on Home Page (/)
    if (pathname !== '/') {
      setIsScrolled(true);
    } else {
      setIsScrolled(window.scrollY > 40);
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  // Autocomplete logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const filtered = PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.collection.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchSuggestions(filtered.slice(0, 5));
  }, [searchQuery]);

  // Close menus when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const isHome = pathname === '/';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 font-sans">
        {/* Announcement Bar */}
        {showAnnouncement && (
          <div className="bg-secondary text-white text-center py-2 px-4 text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium flex items-center justify-between relative">
            <div className="mx-auto">Free Shipping on Orders Over $150</div>
            <button
              onClick={() => setShowAnnouncement(false)}
              className="absolute right-4 hover:text-primary transition-colors duration-300"
              aria-label="Dismiss Announcement"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Navbar */}
        <div
          className={`w-full py-4 md:py-6 px-6 md:px-12 flex items-center justify-between border-b transition-all duration-500 ${
            isScrolled
              ? 'bg-white/90 backdrop-blur-md border-divider shadow-sm text-primary'
              : isHome
              ? 'bg-transparent border-white/10 text-white'
              : 'bg-white/90 backdrop-blur-md border-divider text-primary'
          }`}
        >
          {/* Left Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs uppercase tracking-[0.2em] font-medium">
            <Link
              href="/shop"
              className={`hover:text-secondary transition-colors duration-300 ${
                pathname === '/shop' ? 'text-primary font-bold' : ''
              }`}
            >
              Shop
            </Link>
            <Link
              href="/collections"
              className={`hover:text-secondary transition-colors duration-300 ${
                pathname === '/collections' ? 'text-primary font-bold' : ''
              }`}
            >
              Collections
            </Link>
            <Link
              href="/custom"
              className={`hover:text-secondary transition-colors duration-300 ${
                pathname === '/custom' ? 'text-primary font-bold' : ''
              }`}
            >
              Custom Box
            </Link>
            <Link
              href="/about"
              className={`hover:text-secondary transition-colors duration-300 ${
                pathname === '/about' ? 'text-primary font-bold' : ''
              }`}
            >
              Our Story
            </Link>
          </nav>

          {/* Left Menu Trigger (Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden hover:text-secondary transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu size={20} className="stroke-[1.5]" />
          </button>

          {/* Center: Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <Link href="/" className="focus:outline-none">
              <span className="font-serif text-xl md:text-2xl lg:text-3xl tracking-[0.15em] uppercase font-bold hover:opacity-80 transition-opacity">
                Lebami
              </span>
            </Link>
          </div>

          {/* Right Links (Search, Account, Cart) */}
          <div className="flex items-center space-x-4 md:space-x-6 text-current">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hover:text-secondary transition-colors"
              aria-label="Search Catalog"
            >
              <Search size={20} className="stroke-[1.5]" />
            </button>

            {/* Account Dashboard Link */}
            <Link
              href="/account"
              className="hover:text-secondary transition-colors hidden sm:block"
              aria-label="User Account"
            >
              <User size={20} className="stroke-[1.5]" />
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/account?tab=wishlist"
              className="hover:text-secondary transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart size={20} className="stroke-[1.5]" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white rounded-full text-[8px] w-4 h-4 flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => setCartOpen(true)}
              className="hover:text-secondary transition-colors relative flex items-center"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={20} className="stroke-[1.5]" />
              <span className="absolute -top-1 -right-1 bg-secondary text-white rounded-full text-[8px] w-4 h-4 flex items-center justify-center font-bold">
                {getCartCount()}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Down Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-0 left-0 right-0 bg-white border-b border-divider shadow-xl py-8 px-6 md:px-12 z-50"
            >
              <div className="max-w-4xl mx-auto flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-primary">
                    Search Lebami
                  </h3>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <X size={20} className="stroke-[1.5]" />
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative flex border-b border-divider pb-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search for preserved roses, box shapes, or color swatches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-lg md:text-xl font-serif text-primary placeholder-gray/60 bg-transparent border-none focus:outline-none pr-10"
                  />
                  <button type="submit" className="absolute right-0 top-1/2 transform -translate-y-1/2 text-secondary">
                    <Search size={22} />
                  </button>
                </form>

                {/* Suggestions */}
                {searchSuggestions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] uppercase tracking-widest text-muted font-semibold">
                      Suggested Arrangements
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchSuggestions.map((product) => (
                        <Link
                          key={product.slug}
                          href={`/product/${product.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center space-x-3 p-2 hover:bg-cream border border-transparent hover:border-divider transition-all duration-300"
                        >
                          <div className="relative w-12 h-12 bg-cream overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-primary">{product.name}</p>
                            <p className="text-[10px] text-muted uppercase tracking-wider">
                              {product.collection} — ${product.price}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchQuery.trim() && searchSuggestions.length === 0 && (
                  <p className="text-xs text-muted italic">No immediate suggestions. Press Enter to search catalog.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-In Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-full max-w-sm bg-white shadow-2xl flex flex-col py-6 px-6"
            >
              <div className="flex items-center justify-between pb-6 border-b border-divider">
                <span className="font-serif text-lg tracking-[0.15em] uppercase font-bold text-primary">
                  Lebami
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-muted hover:text-primary transition-colors"
                >
                  <X size={20} className="stroke-[1.5]" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 py-8 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <Link
                    href="/shop"
                    className="flex items-center justify-between text-sm uppercase tracking-[0.2em] font-medium text-primary hover:text-secondary py-2 border-b border-divider/40 transition-colors"
                  >
                    <span>Shop All</span>
                    <ChevronRight size={16} />
                  </Link>
                  <Link
                    href="/collections"
                    className="flex items-center justify-between text-sm uppercase tracking-[0.2em] font-medium text-primary hover:text-secondary py-2 border-b border-divider/40 transition-colors"
                  >
                    <span>Collections</span>
                    <ChevronRight size={16} />
                  </Link>
                  <Link
                    href="/custom"
                    className="flex items-center justify-between text-sm uppercase tracking-[0.2em] font-medium text-primary hover:text-secondary py-2 border-b border-divider/40 transition-colors"
                  >
                    <span>Custom Arrangements</span>
                    <ChevronRight size={16} />
                  </Link>
                  <Link
                    href="/about"
                    className="flex items-center justify-between text-sm uppercase tracking-[0.2em] font-medium text-primary hover:text-secondary py-2 border-b border-divider/40 transition-colors"
                  >
                    <span>Our Story</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>

                <div className="pt-8 border-t border-divider space-y-4 text-xs uppercase tracking-widest text-muted">
                  <Link href="/account" className="block hover:text-secondary py-1">
                    My Account
                  </Link>
                  <Link href="/faq" className="block hover:text-secondary py-1">
                    FAQ & Support
                  </Link>
                  <Link href="/shipping-returns" className="block hover:text-secondary py-1">
                    Shipping & Returns
                  </Link>
                  <Link href="/contact" className="block hover:text-secondary py-1">
                    Contact Us
                  </Link>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="border-t border-divider pt-6 text-center text-[10px] tracking-[0.2em] text-secondary font-medium">
                ESTABLISHED 2015 • Preserved in Luxury
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
