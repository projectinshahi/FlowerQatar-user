'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import ProductCard from '../../../components/ProductCard';
import QuickViewModal from '../../../components/QuickViewModal';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { Product } from '../../../types';
import { ROSE_COLORS } from '../../../data/products';

type CategoryOption = { name: string; slug: string };

function ShopContent({
  products,
  categories,
  heroTitle,
}: {
  products: Product[];
  categories: CategoryOption[];
  heroTitle: string;
}) {
  // Navbar-driven filters (category/collection/tab) are already applied on the server;
  // the sidebar below refines the result (collection, colour, price, sort).
  const [selectedShape, setSelectedShape] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(600);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('best-selling');

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [visibleCount, setVisibleCount] = useState(6);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  useEffect(() => {
    let result = [...products];

    if (selectedShape) {
      result = result.filter((p) => p.collection === selectedShape);
    }
    if (selectedColor) {
      result = result.filter((p) => p.colors.some((c) => c.name === selectedColor));
    }
    if (selectedPriceRange) {
      result = result.filter((p) => p.price <= selectedPriceRange);
    }
    if (selectedOccasion) {
      if (selectedOccasion === 'Romantic') {
        result = result.filter((p) => p.slug.includes('heart') || p.colors.some((c) => c.name.includes('Red')));
      } else if (selectedOccasion === 'Anniversary') {
        result = result.filter((p) => p.price >= 200);
      } else if (selectedOccasion === 'Mini Gift') {
        result = result.filter((p) => p.price < 100);
      }
    }

    if (sortOption === 'price-low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'best-selling') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    } else if (sortOption === 'newest') {
      result.reverse();
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredProducts(result);
    setVisibleCount(6);
  }, [products, selectedShape, selectedColor, selectedPriceRange, selectedOccasion, sortOption]);

  const handleResetFilters = () => {
    setSelectedShape('');
    setSelectedColor('');
    setSelectedPriceRange(600);
    setSelectedOccasion('');
    setSortOption('best-selling');
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, filteredProducts.length));
  };

  const openQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  return (
    <div className="w-full mx-auto font-sans text-primary">
      <div className="px-6 pt-8 pb-4">
        <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }]} />
      </div>

      <div className="relative w-full overflow-hidden border-y border-divider/60 py-20 md:py-32 px-8 text-center mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero_background_1782286769476.png')" }}
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C1A87D] font-semibold block mb-3">
            Lebami Collection
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-wide text-[#800000] mb-4 capitalize">
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
          {filteredProducts.length} PRODUCTS
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-widest text-primary font-medium">
            <span>SORT BY:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="appearance-none bg-transparent border-none pr-5 text-[11px] uppercase tracking-widest text-primary focus:outline-none focus:ring-0 cursor-pointer"
              suppressHydrationWarning
            >
              <option value="best-selling">FEATURED</option>
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
            {categories.length > 0 && (
              <div className="border-b border-divider/40 py-5">
                <h4 className="text-[11px] uppercase tracking-[0.2em] font-sans text-primary mb-3">Category</h4>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setSelectedShape('')}
                    className={`text-left text-[12px] py-1 transition-colors ${!selectedShape ? 'text-secondary font-semibold' : 'text-muted hover:text-primary'}`}
                  >
                    All Collections
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => setSelectedShape(c.slug)}
                      className={`text-left text-[12px] py-1 capitalize transition-colors ${selectedShape === c.slug ? 'text-secondary font-semibold' : 'text-muted hover:text-primary'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="border-b border-divider/40 py-5">
              <h4 className="text-[11px] uppercase tracking-[0.2em] font-sans text-primary mb-3">Rose Color</h4>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedColor('')} className={`px-2.5 py-1 text-[10px] border ${!selectedColor ? 'bg-primary text-white border-primary' : 'border-divider text-muted'}`}>ALL</button>
                {ROSE_COLORS.map((c) => (
                  <button key={c.name} onClick={() => setSelectedColor(c.name)} className={`px-2.5 py-1 text-[10px] border flex items-center gap-1.5 ${selectedColor === c.name ? 'bg-secondary text-white border-secondary' : 'border-divider text-muted'}`}>
                    <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                    <span>{c.name.split(' ')[1] || c.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-b border-divider/40 py-5">
              <div className="flex justify-between text-[11px] uppercase tracking-[0.2em] font-sans text-primary mb-3">
                <span>Price</span>
                <span className="text-secondary font-bold">QAR {selectedPriceRange}</span>
              </div>
              <input type="range" min="39" max="600" step="10" value={selectedPriceRange} onChange={(e) => setSelectedPriceRange(Number(e.target.value))} className="w-full accent-gold h-1 bg-divider" />
            </div>
          </div>
        </aside>

        <div className="flex-grow transition-all duration-700 ease-in-out">
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-divider bg-cream rounded-none space-y-4">
              <p className="text-sm text-muted italic">No items found matching the selected criteria.</p>
              <button onClick={handleResetFilters} className="px-6 py-2.5 bg-secondary hover:bg-secondary-hover text-white text-xs uppercase tracking-widest transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid gap-0 border-l border-t border-divider/40 grid-cols-2 lg:grid-cols-3">
                {filteredProducts.slice(0, visibleCount).map((product, i) => (
                  <ProductCard key={product.slug} product={product} onQuickView={openQuickView} priority={i < 3} />
                ))}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className="text-center pt-8">
                  <button onClick={handleLoadMore} className="px-8 py-3.5 border border-secondary text-secondary hover:bg-secondary hover:text-white uppercase text-xs tracking-[0.2em] font-semibold transition-colors duration-500 shadow-sm">
                    Load More Arrangements
                  </button>
                  <p className="text-[10px] text-muted uppercase tracking-widest mt-3 font-medium">
                    Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} arrangements
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
                <button onClick={() => setIsFilterDrawerOpen(false)} className="text-muted hover:text-primary"><X size={20} /></button>
              </div>
              {categories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[10px] uppercase tracking-widest font-semibold text-primary mb-3">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedShape('')} className={`px-3 py-1.5 text-[10px] border tracking-wider uppercase ${!selectedShape ? 'bg-primary text-white border-primary' : 'border-divider text-muted'}`}>All</button>
                    {categories.map((c) => (
                      <button key={c.slug} onClick={() => setSelectedShape(c.slug)} className={`px-3 py-1.5 text-[10px] border tracking-wider uppercase capitalize ${selectedShape === c.slug ? 'bg-primary text-white border-primary' : 'border-divider text-muted'}`}>{c.name}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-widest font-semibold text-primary mb-3">Rose Color</h4>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedColor('')} className={`px-2.5 py-1 text-[10px] border ${!selectedColor ? 'bg-primary text-white border-primary' : 'border-divider text-muted'}`}>ALL</button>
                  {ROSE_COLORS.map((c) => (
                    <button key={c.name} onClick={() => setSelectedColor(c.name)} className={`px-2.5 py-1 text-[10px] border flex items-center space-x-1.5 ${selectedColor === c.name ? 'bg-secondary text-white border-secondary' : 'border-divider text-muted'}`}>
                      <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                      <span>{c.name.split(' ')[1] || c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-semibold mb-3">
                  <span>Price Cap</span>
                  <span className="text-secondary font-bold">QAR {selectedPriceRange}</span>
                </div>
                <input type="range" min="39" max="600" step="10" value={selectedPriceRange} onChange={(e) => setSelectedPriceRange(Number(e.target.value))} className="w-full accent-gold h-1 bg-divider" />
              </div>
            </div>
            <div className="pt-6 border-t border-divider flex gap-3">
              <button onClick={handleResetFilters} className="flex-grow py-3 border border-divider hover:border-primary text-[10px] uppercase tracking-widest transition-colors font-medium text-center">Clear</button>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="flex-grow py-3 bg-primary hover:bg-secondary text-white text-[10px] uppercase tracking-widest font-semibold transition-colors text-center">Apply</button>
            </div>
          </div>
        </div>
      )}

      <QuickViewModal product={selectedProduct} isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} />
    </div>
  );
}

export default function ShopClient({
  products,
  categories,
  heroTitle = 'The Collection',
}: {
  products: Product[];
  categories: CategoryOption[];
  heroTitle?: string;
}) {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 text-center font-sans text-muted">
        Loading Atelier Collection...
      </div>
    }>
      <ShopContent products={products} categories={categories} heroTitle={heroTitle} />
    </Suspense>
  );
}
