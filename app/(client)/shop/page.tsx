'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, ChevronDown, RefreshCw, X } from 'lucide-react';
import ProductCard from '../../../components/ProductCard';
import QuickViewModal from '../../../components/QuickViewModal';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { Product } from '../../../types';
import { PRODUCTS, ROSE_COLORS } from '../../../data/products';

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCollection = searchParams.get('collection') || '';

  // Filter States
  const [selectedShape, setSelectedShape] = useState<string>(initialCollection);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(600);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('best-selling');

  // Mobile Filter Drawer Toggle
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Products state
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(PRODUCTS);
  const [visibleCount, setVisibleCount] = useState(6);

  // Quick View Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Sync initial collection from query param
  useEffect(() => {
    if (initialCollection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedShape(initialCollection);
    }
  }, [initialCollection]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...PRODUCTS];

    // Filter by Box Shape (corresponds to collection in new schema)
    if (selectedShape) {
      result = result.filter((p) => p.collection === selectedShape);
    }

    // Filter by Rose Color
    if (selectedColor) {
      result = result.filter((p) => p.colors.some((c) => c.name === selectedColor));
    }

    // Filter by Price Range
    if (selectedPriceRange) {
      result = result.filter((p) => p.price <= selectedPriceRange);
    }

    // Filter by Occasion (mocking check)
    if (selectedOccasion) {
      if (selectedOccasion === 'Romantic') {
        result = result.filter((p) => p.slug.includes('heart') || p.colors.some(c => c.name.includes('Red')));
      } else if (selectedOccasion === 'Anniversary') {
        result = result.filter((p) => p.price >= 200);
      } else if (selectedOccasion === 'Mini Gift') {
        result = result.filter((p) => p.price < 100);
      }
    }

    // Sort Options
    if (sortOption === 'price-low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'best-selling') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    } else if (sortOption === 'newest') {
      // Just reverse default order for mock newest
      result.reverse();
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredProducts(result);
    setVisibleCount(6); // reset pagination when filters change
  }, [selectedShape, selectedColor, selectedPriceRange, selectedOccasion, sortOption]);

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
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }]} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden border-y border-divider/60 py-20 md:py-32 px-8 text-center mb-12 w-screen -ml-[50vw] left-1/2">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero_background_1782286769476.png')" }}
        />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C1A87D] font-semibold block mb-3">
            Lebami Collection
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-wide text-[#800000] mb-4">
            The Collection
          </h1>
          <p className="text-xs md:text-sm text-white/95 max-w-md mx-auto leading-relaxed">
            Explore our signature boxes of preserved Eternity® Roses. Handcrafted to order and designed to bloom in your space for a full year.
          </p>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex items-center justify-between border-b border-divider pb-4 mb-8">
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className="flex items-center space-x-2 text-xs uppercase tracking-widest text-primary hover:text-secondary transition-colors font-medium"
        >
          <Filter size={16} />
          <span>Filters</span>
        </button>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider text-muted hidden sm:inline">Sort By:</span>
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-transparent border-none pr-8 pl-2 py-1 text-xs uppercase tracking-wider font-medium text-primary focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="best-selling">Best Selling</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="newest">Newest Releases</option>
              </select>
              <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted pointer-events-none">
                <ChevronDown size={12} />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Left Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-8 pr-6 border-r border-divider/60">

          {/* Shape filter */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold text-primary mb-4">Categories</h4>
            <div className="space-y-2">
              {[
                { name: 'All Categories', value: '' },
                { name: 'Red Roses', value: 'red-roses' },
                { name: 'Pink Roses', value: 'pink-roses' },
                { name: 'Orchids', value: 'orchids' },
                { name: 'Lilies', value: 'lilies' },
                { name: 'Le Mini (Single)', value: 'le-mini' },
                { name: 'Round Boxes', value: 'round' },
                { name: 'Square Boxes', value: 'square' },
                { name: 'Heart Boxes', value: 'heart' },
              ].map((shape) => (
                <label key={shape.value} className="flex items-center space-x-2 text-xs text-muted hover:text-primary cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="shape"
                    checked={selectedShape === shape.value}
                    onChange={() => setSelectedShape(shape.value)}
                    className="rounded-full border-divider text-secondary focus:ring-secondary"
                  />
                  <span>{shape.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Color filter */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold text-primary mb-4">Rose Color</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedColor('')}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border rounded-none transition-colors ${!selectedColor ? 'bg-primary text-white border-primary' : 'border-divider hover:border-primary text-muted'
                  }`}
              >
                All Colors
              </button>
              {ROSE_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border rounded-none transition-colors flex items-center space-x-1.5 ${selectedColor === color.name ? 'bg-secondary text-white border-secondary' : 'border-divider hover:border-primary text-muted'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" style={{ backgroundColor: color.hex }} />
                  <span>{color.name.split(' ')[1] || color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <div className="flex justify-between items-baseline mb-4">
              <h4 className="text-xs uppercase tracking-widest font-semibold text-primary">Max Price</h4>
              <span className="text-xs font-semibold text-secondary">${selectedPriceRange}</span>
            </div>
            <input
              type="range"
              min="39"
              max="600"
              step="10"
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(Number(e.target.value))}
              className="w-full accent-gold bg-divider h-1 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted pt-1">
              <span>$39</span>
              <span>$600</span>
            </div>
          </div>

          {/* Occasion Filter */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold text-primary mb-4">Occasion</h4>
            <div className="space-y-2">
              {[
                { name: 'Any Occasion', value: '' },
                { name: 'Romantic & Love', value: 'Romantic' },
                { name: 'Anniversary Gift', value: 'Anniversary' },
                { name: 'Mini & Thoughtful', value: 'Mini Gift' },
              ].map((occ) => (
                <label key={occ.value} className="flex items-center space-x-2 text-xs text-muted hover:text-primary cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="occasion"
                    checked={selectedOccasion === occ.value}
                    onChange={() => setSelectedOccasion(occ.value)}
                    className="rounded-full border-divider text-secondary focus:ring-secondary"
                  />
                  <span>{occ.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reset Filters button */}
          <button
            onClick={handleResetFilters}
            className="w-full flex items-center justify-center space-x-2 py-3 border border-divider hover:border-primary text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-500 bg-cream rounded-none"
          >
            <RefreshCw size={12} />
            <span>Reset Filters</span>
          </button>

        </aside>

        {/* Product Catalog Grid */}
        <div className="flex-grow">
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-divider bg-cream rounded-none space-y-4">
              <p className="text-sm text-muted italic">No items found matching the selected criteria.</p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-secondary hover:bg-secondary-hover text-white text-xs uppercase tracking-widest transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Responsive columns */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
                {filteredProducts.slice(0, visibleCount).map((product) => (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    onQuickView={openQuickView}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {visibleCount < filteredProducts.length && (
                <div className="text-center pt-8">
                  <button
                    onClick={handleLoadMore}
                    className="px-8 py-3.5 border border-secondary text-secondary hover:bg-secondary hover:text-white uppercase text-xs tracking-[0.2em] font-semibold transition-colors duration-500 shadow-sm"
                  >
                    Load More Arrangements
                  </button>
                  <p className="text-[10px] text-muted uppercase tracking-widest mt-3 font-medium">
                    Showing {visibleCount} of {filteredProducts.length} arrangements
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
          {/* Backdrop */}
          <div
            onClick={() => setIsFilterDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />
          {/* Panel */}
          <div className="relative w-full max-w-sm bg-white shadow-2xl p-6 flex flex-col justify-between z-10 overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-divider mb-6">
                <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-primary">Filter Arrangements</h3>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="text-muted hover:text-primary">
                  <X size={20} />
                </button>
              </div>

              {/* Shapes */}
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-widest font-semibold text-primary mb-3">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'All', value: '' },
                    { name: 'Red Roses', value: 'red-roses' },
                    { name: 'Pink Roses', value: 'pink-roses' },
                    { name: 'Orchids', value: 'orchids' },
                    { name: 'Lilies', value: 'lilies' },
                    { name: 'Le Mini', value: 'le-mini' },
                    { name: 'Round', value: 'round' },
                    { name: 'Square', value: 'square' },
                    { name: 'Heart', value: 'heart' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSelectedShape(s.value)}
                      className={`px-3 py-1.5 text-[10px] border tracking-wider uppercase ${selectedShape === s.value ? 'bg-primary text-white border-primary' : 'border-divider text-muted'
                        }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-widest font-semibold text-primary mb-3">Rose Color</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedColor('')}
                    className={`px-2.5 py-1 text-[10px] border ${!selectedColor ? 'bg-primary text-white border-primary' : 'border-divider text-muted'
                      }`}
                  >
                    ALL
                  </button>
                  {ROSE_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`px-2.5 py-1 text-[10px] border flex items-center space-x-1.5 ${selectedColor === c.name ? 'bg-secondary text-white border-secondary' : 'border-divider text-muted'
                        }`}
                    >
                      <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                      <span>{c.name.split(' ')[1] || c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-6">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-semibold mb-3">
                  <span>Price Cap</span>
                  <span className="text-secondary font-bold">${selectedPriceRange}</span>
                </div>
                <input
                  type="range"
                  min="39"
                  max="600"
                  step="10"
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(Number(e.target.value))}
                  className="w-full accent-gold h-1 bg-divider"
                />
              </div>

              {/* Occasions */}
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-widest font-semibold text-primary mb-3">Occasion</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'All', value: '' },
                    { name: 'Romantic', value: 'Romantic' },
                    { name: 'Anniversary', value: 'Anniversary' },
                    { name: 'Thoughtful Gift', value: 'Mini Gift' },
                  ].map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setSelectedOccasion(o.value)}
                      className={`px-3 py-1.5 text-[10px] border tracking-wider uppercase ${selectedOccasion === o.value ? 'bg-primary text-white border-primary' : 'border-divider text-muted'
                        }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-divider flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-grow py-3 border border-divider hover:border-primary text-[10px] uppercase tracking-widest transition-colors font-medium text-center rounded-none"
              >
                Clear
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-grow py-3 bg-primary hover:bg-secondary text-white text-[10px] uppercase tracking-widest font-semibold transition-colors text-center rounded-none"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Portal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 text-center font-sans text-muted">
        Loading Atelier Collection...
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
