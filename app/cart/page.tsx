'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import Image from '../../components/LuxuryImage';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShieldCheck, Truck, ShoppingBag, ArrowLeft } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, getCartTotal } = useApp();

  const subtotal = getCartTotal();
  const shipping = subtotal >= 150 ? 0 : 15;
  const tax = Math.round(subtotal * 0.08); // 8% tax mock
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Shopping Cart', href: '/cart' }]} />

      <h1 className="font-serif text-3xl md:text-4xl text-primary mb-10 tracking-wide mt-2">
        Your Atelier Cart
      </h1>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-cream border border-divider/60 rounded-none space-y-6">
          <p className="text-muted text-sm italic">Your luxury cart is currently empty.</p>
          <p className="text-xs text-muted/80 max-w-sm mx-auto leading-relaxed">
            Each arrangement is composed using high-quality preserved Ecuadorian roses that last a year.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-block bg-primary hover:bg-secondary text-white text-xs uppercase tracking-[0.2em] font-medium py-4 px-8 transition-colors duration-500 rounded-none shadow-md"
            >
              Explore The Collection
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Cart Items List (Col: 8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-divider/60 divide-y divide-divider">
              {cart.map((item) => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 bg-white">
                  {/* Image */}
                  <div className="relative w-24 h-28 bg-cream flex-shrink-0 border border-divider/40 rounded-none">
                    {(() => {
                      const prodImage = ('image' in item.product && item.product.image) || 
                                       ('images' in item.product && item.product.images && item.product.images[0]) || 
                                       '';
                      return prodImage ? (
                        <Image
                          src={prodImage}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-secondary font-semibold uppercase tracking-widest text-center px-1">
                          Preserved Custom
                        </div>
                      );
                    })()}
                  </div>

                  {/* Info Column */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <h3 className="text-xs uppercase tracking-wider font-semibold text-primary">
                          {item.product.name}
                        </h3>
                        <span className="text-xs font-semibold text-primary">${item.price * item.quantity}</span>
                      </div>

                      {/* Customized parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted tracking-wide">
                        {item.boxShape && (
                          <p><span className="font-semibold text-primary/70">Box Shape:</span> {item.boxShape}</p>
                        )}
                        <p><span className="font-semibold text-primary/70">Rose Swatch:</span> {item.roseColor}</p>
                        <p><span className="font-semibold text-primary/70">Box Material:</span> {item.boxColor}</p>
                        {item.size && (
                          <p><span className="font-semibold text-primary/70">Arrangement Size:</span> {item.size}</p>
                        )}
                        {item.lid && (
                          <p><span className="font-semibold text-primary/70">Lid Selection:</span> {item.lid}</p>
                        )}
                        {item.card && (
                          <p className="sm:col-span-2 italic text-secondary mt-1">
                            <span className="font-semibold text-primary/70 not-italic">Calligraphy Greeting:</span> "{item.card}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector & Action Button */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-divider/40">
                      <div className="flex items-center border border-divider bg-cream rounded-none">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1.5 text-muted hover:text-primary transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-xs font-semibold text-primary">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1.5 text-muted hover:text-primary transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="flex items-center space-x-1.5 text-[10px] uppercase tracking-widest text-muted hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Remove Item</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back link */}
            <Link
              href="/shop"
              className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest text-muted hover:text-secondary transition-colors pt-2"
            >
              <ArrowLeft size={12} />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Right: Order Summary (Col: 4) */}
          <div className="lg:col-span-4">
            <div className="border border-divider/60 p-6 bg-cream/40 space-y-6 sticky top-28">
              <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-primary pb-3 border-b border-divider">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs tracking-wide">
                <div className="flex justify-between text-muted">
                  <span>Cart Subtotal</span>
                  <span className="font-medium text-primary">${subtotal}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Estimated Shipping</span>
                  <span className="font-medium text-primary">
                    {shipping === 0 ? 'Complimentary' : `$${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Estimated Sales Tax</span>
                  <span className="font-medium text-primary">${tax}</span>
                </div>
                <div className="border-t border-divider pt-4 flex justify-between font-semibold text-sm">
                  <span className="uppercase tracking-widest text-xs">Total Estimate</span>
                  <span className="text-secondary text-lg font-bold">${total}</span>
                </div>
              </div>

              {shipping > 0 && (
                <p className="text-[10px] text-secondary font-medium bg-secondary/5 border border-secondary/10 p-3 text-center uppercase tracking-widest leading-relaxed">
                  Add ${(150 - subtotal)} more to qualify for complimentary shipping!
                </p>
              )}

              <div className="space-y-3 pt-2">
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center py-4 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors duration-500 rounded-none shadow-md"
                >
                  Proceed to Checkout
                </Link>
                <div className="text-[10px] text-muted/80 space-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <Truck size={14} className="text-secondary" />
                    <span>Free Shipping on Orders Over $150</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck size={14} className="text-secondary" />
                    <span>1-Year Fresh Preservation Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
