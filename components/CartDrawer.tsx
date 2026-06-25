'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LuxuryImage from './LuxuryImage';
import Link from 'next/link';
import Image from 'next/image';

export default function CartDrawer() {
  const { cart, isCartOpen, setCartOpen, updateCartQuantity, removeFromCart, getCartTotal } = useApp();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
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
                  onClick={() => setCartOpen(false)}
                  className="text-primary hover:text-secondary transition-colors rounded-none mr-4"
                >
                  <X size={22} className="stroke-[1.2]" />
                </button>
                <h2 className="text-xs uppercase tracking-[0.15em] font-medium text-primary">MY CART</h2>
              </div>

              {/* Progress Bar Section */}
              <div className="px-5 md:px-6 py-5 border-b border-[#EAEAEA] text-center bg-white">
                <p className="font-serif text-[13px] md:text-[14px] text-primary mb-3 leading-snug md:leading-normal">
                  Add $399 for your Complimentary Fragrance Discovery Set.
                </p>
                <div className="w-full h-[6px] bg-[#F0F0F0] rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-secondary w-0 transition-all duration-500"></div>
                </div>
                <p className="text-[9px] text-[#888] uppercase tracking-widest mt-2">
                  COMPLIMENTARY GIFT ON ALL ORDERS $399+
                </p>
              </div>

              {/* Items List or Empty State */}
              <div className="flex-1 overflow-y-auto bg-white">
                {cart.length === 0 ? (
                  <div className="flex flex-col">
                    <div className="flex flex-col items-center pt-10 pb-8">
                      <p className="font-serif text-[18px] md:text-[20px] text-primary mb-6">Your cart is empty</p>
                      <Link
                        href="/shop"
                        onClick={() => setCartOpen(false)}
                        className="bg-black text-white px-8 md:px-10 py-3.5 text-[10px] uppercase tracking-widest hover:bg-secondary transition-colors font-medium"
                      >
                        LET'S SHOP
                      </Link>
                    </div>

                    {/* Recommendations Grid */}
                    <div className="grid grid-cols-2 gap-1 px-3 md:px-4 pb-12">
                      {/* Item 1 */}
                      <Link href="/shop/roses" onClick={() => setCartOpen(false)}>
                        <div className="relative group cursor-pointer aspect-square bg-gray-100 overflow-hidden">
                          <Image src="/images/category_bouquets_1782290106325.png" alt="Roses" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <span className="font-serif text-white text-[14px] md:text-[16px] tracking-widest uppercase">ROSES</span>
                          </div>
                        </div>
                      </Link>
                      {/* Item 2 */}
                      <Link href="/shop/mixed-florals" onClick={() => setCartOpen(false)}>
                        <div className="relative group cursor-pointer aspect-square bg-gray-100 overflow-hidden">
                          <Image src="/images/category_bouquets_1782290106325.png" alt="Mixed Florals" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <span className="font-serif text-white text-[14px] md:text-[16px] tracking-widest uppercase text-center px-2">MIXED FLORALS</span>
                          </div>
                        </div>
                      </Link>
                      {/* Item 3 */}
                      <Link href="/shop/hydrangeas" onClick={() => setCartOpen(false)}>
                        <div className="relative group cursor-pointer aspect-square bg-gray-100 overflow-hidden">
                          <Image src="/images/category_bouquets_1782290106325.png" alt="Hydrangeas" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <span className="font-serif text-white text-[14px] md:text-[16px] tracking-widest uppercase">HYDRANGEAS</span>
                          </div>
                        </div>
                      </Link>
                      {/* Item 4 */}
                      <Link href="/shop" onClick={() => setCartOpen(false)}>
                        <div className="relative group cursor-pointer aspect-square bg-gray-100 overflow-hidden">
                          <Image src="/images/category_bouquets_1782290106325.png" alt="Shop All" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <span className="font-serif text-white text-[14px] md:text-[16px] tracking-widest uppercase">SHOP ALL</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 md:px-6 py-4 space-y-6">
                    {cart.map((item) => {
                      const prodImage = ('image' in item.product && item.product.image) || 
                                       ('images' in item.product && item.product.images && item.product.images[0]) || 
                                       '';
                      return (
                        <div key={item.id} className="flex space-x-3 md:space-x-4 border-b border-divider/50 pb-6 last:border-0 last:pb-0">
                          {/* Product Image */}
                          <div className="relative w-16 h-20 md:w-20 md:h-24 bg-cream flex-shrink-0">
                            {prodImage ? (
                              <LuxuryImage
                                src={prodImage}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-secondary tracking-widest uppercase">
                                Preserved
                              </div>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-primary mb-1 gap-2">
                                <h3 className="line-clamp-2 leading-snug truncate whitespace-normal">{item.product.name}</h3>
                                <span className="flex-shrink-0">${item.price * item.quantity}</span>
                              </div>
                              
                              {/* Selected Options */}
                              <div className="space-y-0.5 text-[10px] md:text-[11px] text-muted tracking-wide mt-1">
                                {item.boxShape && (
                                  <p className="truncate"><span className="font-medium text-primary/70">Box Shape:</span> {item.boxShape}</p>
                                )}
                                <p className="truncate"><span className="font-medium text-primary/70">Rose:</span> {item.roseColor}</p>
                                <p className="truncate"><span className="font-medium text-primary/70">Box:</span> {item.boxColor}</p>
                                {item.size && (
                                  <p className="truncate"><span className="font-medium text-primary/70">Size:</span> {item.size}</p>
                                )}
                                {item.lid && (
                                  <p className="truncate"><span className="font-medium text-primary/70">Lid:</span> {item.lid}</p>
                                )}
                                {item.card && (
                                  <p className="italic text-secondary truncate max-w-full">
                                    <span className="font-medium text-primary/70 not-italic">Card:</span> "{item.card}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Quantity and Actions */}
                            <div className="flex items-center justify-between mt-3 md:mt-4">
                              <div className="flex items-center border border-divider bg-cream rounded-none">
                                <button
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  className="px-2 py-1 text-muted hover:text-primary transition-colors rounded-none"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="px-2 text-xs font-medium text-primary">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  className="px-2 py-1 text-muted hover:text-primary transition-colors rounded-none"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-muted/50 hover:text-red-500 transition-colors rounded-none"
                                title="Remove item"
                              >
                                <Trash2 size={14} className="stroke-[1.5]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary and Checkout */}
              {cart.length > 0 && (
                <div className="border-t border-divider px-5 md:px-6 py-5 md:py-6 bg-[#F8F8F8] space-y-4">
                  <div className="flex justify-between text-xs uppercase tracking-widest text-primary font-medium">
                    <span>Subtotal</span>
                    <span className="font-semibold">${getCartTotal()}</span>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-[#888] italic leading-snug">
                    Shipping & taxes calculated at checkout. Eternity preservation guaranteed.
                  </p>
                  
                  <div className="space-y-2 pt-2">
                    <Link
                      href="/checkout"
                      onClick={() => setCartOpen(false)}
                      className="w-full flex items-center justify-center py-3 md:py-3.5 bg-black hover:bg-secondary text-white text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-500 rounded-none shadow-md"
                    >
                      CHECKOUT NOW
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setCartOpen(false)}
                      className="w-full flex items-center justify-center py-3 md:py-3.5 border border-divider hover:border-primary text-primary text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-500 rounded-none"
                    >
                      VIEW CART
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
