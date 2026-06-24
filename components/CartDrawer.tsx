'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LuxuryImage from './LuxuryImage';
import Link from 'next/link';

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
              <div className="px-6 py-6 border-b border-divider flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingBag size={18} className="text-secondary" />
                  <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-primary">Your Atelier Cart</h2>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="text-muted hover:text-primary transition-colors rounded-none"
                >
                  <X size={20} className="stroke-[1.5]" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-muted text-sm italic">Your luxury cart is empty.</p>
                    <Link
                      href="/shop"
                      onClick={() => setCartOpen(false)}
                      className="inline-block border border-secondary px-6 py-3 text-xs uppercase tracking-[0.2em] text-secondary hover:bg-secondary hover:text-white transition-colors duration-500 rounded-none"
                    >
                      Shop The Collection
                    </Link>
                  </div>
                ) : (
                  cart.map((item) => {
                    const prodImage = ('image' in item.product && item.product.image) || 
                                     ('images' in item.product && item.product.images && item.product.images[0]) || 
                                     '';
                    return (
                      <div key={item.id} className="flex space-x-4 border-b border-divider/50 pb-6 last:border-0 last:pb-0">
                        {/* Product Image */}
                        <div className="relative w-20 h-24 bg-cream flex-shrink-0">
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
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-primary mb-1">
                              <h3 className="line-clamp-1">{item.product.name}</h3>
                              <span>${item.price * item.quantity}</span>
                            </div>
                            
                            {/* Selected Options */}
                            <div className="space-y-0.5 text-[11px] text-muted tracking-wide mt-1">
                              {item.boxShape && (
                                <p><span className="font-medium text-primary/70">Box Shape:</span> {item.boxShape}</p>
                              )}
                              <p><span className="font-medium text-primary/70">Rose:</span> {item.roseColor}</p>
                              <p><span className="font-medium text-primary/70">Box:</span> {item.boxColor}</p>
                              {item.size && (
                                <p><span className="font-medium text-primary/70">Size:</span> {item.size}</p>
                              )}
                              {item.lid && (
                                <p><span className="font-medium text-primary/70">Lid:</span> {item.lid}</p>
                              )}
                              {item.card && (
                                <p className="italic text-secondary truncate max-w-[200px]">
                                  <span className="font-medium text-primary/70 not-italic">Card:</span> "{item.card}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quantity and Actions */}
                          <div className="flex items-center justify-between mt-4">
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
                  })
                )}
              </div>

              {/* Summary and Checkout */}
              {cart.length > 0 && (
                <div className="border-t border-divider px-6 py-6 bg-cream space-y-4">
                  <div className="flex justify-between text-xs uppercase tracking-widest text-primary font-medium">
                    <span>Subtotal</span>
                    <span className="font-semibold">${getCartTotal()}</span>
                  </div>
                  <p className="text-[11px] text-muted italic">
                    Shipping & taxes calculated at checkout. Eternity preservation guaranteed.
                  </p>
                  
                  <div className="space-y-2 pt-2">
                    <Link
                      href="/checkout"
                      onClick={() => setCartOpen(false)}
                      className="w-full flex items-center justify-center py-3.5 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-500 rounded-none shadow-md"
                    >
                      Checkout Now
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setCartOpen(false)}
                      className="w-full flex items-center justify-center py-3.5 border border-divider hover:border-primary text-primary text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-500 rounded-none"
                    >
                      View Shopping Cart
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
