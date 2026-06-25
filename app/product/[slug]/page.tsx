'use client';

import React, { use, useState, useEffect } from 'react';
import LuxuryImage from '../../../components/LuxuryImage';
import Link from 'next/link';
import { Heart, ShoppingBag, Truck, ShieldCheck, Ruler, ArrowLeftRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Product } from '../../../types';
import { PRODUCTS, ROSE_COLORS, BOX_COLORS } from '../../../data/products';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ProductCard from '../../../components/ProductCard';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { addToCart, wishlist, toggleWishlist } = useApp();

  const product = PRODUCTS.find((p) => p.slug === slug);

  // States
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedRoseColor, setSelectedRoseColor] = useState('');
  const [selectedBoxColor, setSelectedBoxColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedLid, setSelectedLid] = useState<'Branded Lid' | 'Clear Acrylic' | 'Custom Embossed Message'>('Branded Lid');
  const [customLidText, setCustomLidText] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  
  // Accordion Toggles
  const [openAccordion, setOpenAccordion] = useState<string | null>('details');

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Initialize values when product changes
  useEffect(() => {
    if (product) {
      setSelectedRoseColor(product.colors && product.colors.length > 0 ? product.colors[0].name : '');
      setSelectedBoxColor(product.boxColors && product.boxColors.length > 0 ? product.boxColors[0].name : '');
      setSelectedSize(product.sizes ? product.sizes[0] : '');
      setSelectedLid('Branded Lid');
      setCalculatedPrice(product.price);
      setQuantity(1);
      setSelectedImageIdx(0);

      // Track recently viewed in localStorage
      const stored = localStorage.getItem('v_recently_viewed');
      let list: string[] = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
      // Add current slug to the front, filter duplicates, limit to 4 items
      list = [product.slug, ...list.filter((s) => s !== product.slug)].slice(0, 4);
      localStorage.setItem('v_recently_viewed', JSON.stringify(list));

      // Resolve products from list
      const resolved = list
        .map((s) => PRODUCTS.find((p) => p.slug === s))
        .filter((p): p is Product => !!p && p.slug !== product.slug);
      setRecentlyViewed(resolved);
    }
  }, [product]);

  // Recalculate price dynamically when options change
  useEffect(() => {
    if (!product) return;
    let price = product.price;

    // Size premium
    if (selectedSize && selectedSize.includes('Grande')) {
      price += 100;
    }

    // Lid premium
    if (selectedLid === 'Clear Acrylic') {
      price += 25;
    } else if (selectedLid === 'Custom Embossed Message') {
      price += 50;
    }

    setCalculatedPrice(price);
  }, [selectedSize, selectedLid, product]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center font-sans">
        <h2 className="font-serif text-2xl mb-4">Preserved Arrangement Not Found</h2>
        <Link href="/shop" className="text-secondary underline uppercase tracking-widest text-xs">
          Return to Shop
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.slug);

  const handleAddToCart = () => {
    let compositeLid = selectedLid as string;
    if (selectedLid === 'Custom Embossed Message' && customLidText.trim()) {
      compositeLid = `Custom Lid: "${customLidText.trim()}"`;
    }
    
    addToCart({
      product: {
        slug: product.slug,
        name: product.name,
        price: calculatedPrice,
      },
      quantity,
      roseColor: selectedRoseColor,
      boxColor: selectedBoxColor,
      size: selectedSize || undefined,
      lid: compositeLid,
      price: calculatedPrice,
    });
  };

  // Resolve related products (You May Also Like)
  const relatedProducts = PRODUCTS.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: product.collection.replace('-', ' '), href: `/shop?collection=${product.collection}` },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
        
        {/* Left: Gallery (Vertical on Desktop, Swipe/Scroll on Mobile) (Col: 7) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-3 flex-shrink-0 md:w-20 scrollbar-none justify-center">
            {(product.images || []).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIdx(idx)}
                className={`relative w-16 h-20 bg-cream flex-shrink-0 border transition-all duration-300 rounded-none ${
                  selectedImageIdx === idx ? 'border-secondary ring-1 ring-secondary' : 'border-divider hover:border-primary'
                }`}
              >
                <LuxuryImage src={img} alt={`thumbnail ${idx}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>

          {/* Main Large Image Zoom */}
          <div className="relative flex-grow aspect-[4/5] bg-cream overflow-hidden border border-divider/40">
            <LuxuryImage
              src={product.images ? product.images[selectedImageIdx] : product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {product.isBestSeller && (
              <div className="absolute top-4 left-4 z-10 bg-secondary px-2.5 py-1 text-[9px] text-white uppercase tracking-[0.2em] font-medium shadow-sm">
                Best Seller
              </div>
            )}
          </div>

        </div>

        {/* Right: Customizer Config panel (Col: 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-secondary font-semibold block mb-2">
              Atelier Preserved Rose
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-primary leading-tight mb-2">
              {product.name}
            </h1>
            
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-2xl font-bold text-secondary">${calculatedPrice}</span>
              <span className="text-xs text-muted uppercase tracking-widest">
                ★ {product.rating} ({product.reviewCount} Reviews)
              </span>
            </div>
            
            <p className="text-xs text-muted/80 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Customizer Panel */}
          <div className="luxury-card p-6 space-y-6">
            
            {/* Step 1: Rose Swatches */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary block mb-3">
                1. Selected Rose: <span className="text-secondary font-normal">{selectedRoseColor}</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedRoseColor(color.name)}
                    className={`w-7 h-7 rounded-full border transition-all duration-300 relative ${
                      selectedRoseColor === color.name
                        ? 'border-primary scale-110 ring-1 ring-secondary shadow-md'
                        : 'border-divider hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Step 2: Box Swatches */}
            {product.boxColors && product.boxColors.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary block mb-3">
                  2. Selected Box: <span className="text-secondary font-normal">{selectedBoxColor}</span>
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {product.boxColors.map((box) => (
                    <button
                      key={box.name}
                      onClick={() => setSelectedBoxColor(box.name)}
                      className={`w-7 h-7 rounded-full border transition-all duration-300 relative ${
                        selectedBoxColor === box.name
                          ? 'border-primary scale-110 ring-1 ring-secondary shadow-md'
                          : 'border-divider hover:scale-105'
                      }`}
                      style={{ backgroundColor: box.hex }}
                      title={box.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Size Option (if exists) */}
            {product.sizes && (
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary block mb-3">
                  3. Arrangement Size
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`py-3 px-4 text-xs tracking-wider uppercase border text-center transition-all duration-300 ${
                        selectedSize === sz
                          ? 'border-primary bg-primary text-white font-medium'
                          : 'border-divider bg-transparent text-primary hover:border-primary'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Lid Customization */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary block mb-3">
                4. Select Lid Finishing
              </span>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Classic Branded Lid (Standard)', value: 'Branded Lid' },
                  { label: 'Clear Acrylic Showcase Lid (+$25)', value: 'Clear Acrylic' },
                  { label: 'Gold Foil Custom Message Lid (+$50)', value: 'Custom Embossed Message' },
                ].map((lidOption) => (
                  <button
                    key={lidOption.value}
                    onClick={() => setSelectedLid(lidOption.value as any)}
                    className={`py-2.5 px-4 text-[11px] tracking-wide text-left border transition-all duration-300 ${
                      selectedLid === lidOption.value
                        ? 'border-secondary bg-cream text-primary font-medium shadow-xs'
                        : 'border-divider bg-white text-muted hover:border-primary'
                    }`}
                  >
                    {lidOption.label}
                  </button>
                ))}
              </div>
              
              {/* Optional text card details input */}
              {selectedLid === 'Custom Embossed Message' && (
                <div className="mt-3">
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="Enter custom gold message (max 30 chars)"
                    value={customLidText}
                    onChange={(e) => setCustomLidText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-divider focus:border-secondary outline-none bg-white font-sans placeholder-gray/50 text-primary rounded-none"
                  />
                </div>
              )}
            </div>

          </div>

          {/* Action Hub (Quantity, Add to Cart, Wishlist) */}
          <div className="flex gap-4 items-center">
            {/* Quantity Selector */}
            <div className="flex items-center border border-divider bg-cream h-14 rounded-none">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 text-muted hover:text-primary transition-colors font-semibold rounded-none"
              >
                -
              </button>
              <span className="px-3 text-xs font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-4 text-muted hover:text-primary transition-colors font-semibold rounded-none"
              >
                +
              </button>
            </div>

            {/* Cart Trigger */}
            <button
              onClick={handleAddToCart}
              className="flex-grow h-14 bg-primary hover:bg-secondary text-white uppercase text-xs tracking-[0.2em] font-semibold transition-colors duration-500 shadow-md flex items-center justify-center space-x-2 rounded-none"
            >
              <ShoppingBag size={14} />
              <span>Add to Cart</span>
            </button>

            {/* Wishlist toggle */}
            <button
              onClick={() => toggleWishlist(product.slug)}
              className={`p-4 h-14 border border-divider hover:border-primary transition-all duration-300 flex items-center justify-center rounded-none ${
                isWishlisted ? 'text-secondary border-secondary' : 'text-muted'
              }`}
              aria-label="Wishlist heart"
            >
              <Heart size={20} className={isWishlisted ? 'fill-gold' : ''} />
            </button>
          </div>

          {/* Value props badges */}
          <div className="grid grid-cols-3 gap-2 border-y border-divider py-4 text-center text-[10px] text-muted uppercase tracking-widest font-medium">
            <div className="flex flex-col items-center space-y-1">
              <Truck size={16} className="text-secondary mb-1" />
              <span>1-Yr Preservation</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <ShieldCheck size={16} className="text-secondary mb-1" />
              <span>Real Ecuadorian Roses</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Ruler size={16} className="text-secondary mb-1" />
              <span>Sized to Fit</span>
            </div>
          </div>

          {/* Editorial Accordion specs */}
          <div className="space-y-2">
            {[
              {
                id: 'details',
                title: 'Product Details & Dimensions',
                content: (
                  <div className="text-xs text-muted space-y-2 leading-relaxed">
                    <p><span className="font-semibold text-primary">Arrangement size:</span> {product.dimensions}</p>
                    <p><span className="font-semibold text-primary">Preservation process:</span> {product.materials}</p>
                    <p>Includes an elegant gift wrapping set, protective carrying cover, and a customized certificate of authenticity.</p>
                  </div>
                ),
              },
              {
                id: 'care',
                title: 'Eternity® Care Guidelines',
                content: (
                  <ul className="list-disc list-inside text-xs text-muted space-y-1.5 leading-relaxed">
                    {(product.care || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ),
              },
              {
                id: 'shipping',
                title: 'Atelier Shipping & Gift Services',
                content: (
                  <p className="text-xs text-muted leading-relaxed">
                    We offer complimentary luxury shipping on all orders over $150. Same-day white glove delivery is available in New York City, Los Angeles, and London for requests placed before 1:00 PM. Each box is meticulously secured to arrive in perfect, blooming state.
                  </p>
                ),
              },
            ].map((acc) => {
              const isOpen = openAccordion === acc.id;
              return (
                <div key={acc.id} className="border-b border-divider pb-2">
                  <button
                    onClick={() => setOpenAccordion(isOpen ? null : acc.id)}
                    className="w-full flex items-center justify-between py-3 text-xs uppercase tracking-widest font-semibold text-primary hover:text-secondary transition-colors text-left"
                  >
                    <span>{acc.title}</span>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {isOpen && (
                    <div className="pb-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                      {acc.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Recommended Carousel */}
      <section className="mt-24 border-t border-divider pt-16">
        <h2 className="font-serif text-2xl md:text-3xl text-primary text-center mb-12">
          You May Also Like
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {relatedProducts.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Recently Viewed Carousel */}
      {recentlyViewed.length > 0 && (
        <section className="mt-20 border-t border-divider/60 pt-16">
          <h2 className="font-serif text-xl md:text-2xl text-primary text-center mb-10 tracking-wide font-light">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
