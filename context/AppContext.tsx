'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { ROSE_COLORS, BOX_COLORS } from '../data/products';

export interface CartItem {
  id: string; // Composite key: slug + roseColor + boxColor + size + lid + card
  product: Product | { name: string; slug: string; price: number };
  quantity: number;
  roseColor: string;
  boxColor: string;
  boxShape?: string; // For custom arrangements
  size?: string;
  lid?: string;
  card?: string;
  price: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface CustomArrangementState {
  step: number;
  boxShape: 'Round' | 'Square' | 'Heart';
  roseColor: string;
  boxColor: string;
  quantity: number;
  lid: 'Branded Lid' | 'Clear Acrylic' | 'Custom Embossed Message';
  cardMessage?: string;
}

interface AppContextType {
  cart: CartItem[];
  wishlist: string[];
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  toasts: Toast[];
  customizer: CustomArrangementState;
  
  // Cart Actions
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  // Wishlist Actions
  toggleWishlist: (productSlug: string) => void;
  setWishlistOpen: (open: boolean) => void;

  // Customizer Actions
  updateCustomizer: (updates: Partial<CustomArrangementState>) => void;
  resetCustomizer: () => void;
  
  // Toast Actions
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultCustomizer: CustomArrangementState = {
  step: 1,
  boxShape: 'Round',
  roseColor: ROSE_COLORS[0].name,
  boxColor: BOX_COLORS[0].name,
  quantity: 16,
  lid: 'Branded Lid',
  cardMessage: '',
};

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isWishlistOpen, setWishlistOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [customizer, setCustomizer] = useState<CustomArrangementState>(defaultCustomizer);

  // Load cart and wishlist from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('v_cart');
    const storedWishlist = localStorage.getItem('v_wishlist');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error(e);
      }
    }
    if (storedWishlist) {
      try {
        setWishlist(JSON.parse(storedWishlist));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save cart and wishlist to localStorage on change
  useEffect(() => {
    localStorage.setItem('v_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('v_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Toast Handler
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart Handlers
  const addToCart = (item: Omit<CartItem, 'id'>) => {
    // Generate simple composite ID
    const customKey = `${item.product.slug}-${item.roseColor}-${item.boxColor}-${item.size || ''}-${item.lid || ''}-${item.card || ''}`;
    
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.id === customKey);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }
      return [...prevCart, { ...item, id: customKey }];
    });
    
    addToast(`Added "${item.product.name}" to your cart.`, 'success');
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
    addToast('Item removed from cart.', 'info');
  };

  const updateCartQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === itemId ? { ...item, quantity: qty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Wishlist Handlers
  const toggleWishlist = (slug: string) => {
    setWishlist((prev) => {
      const inWishlist = prev.includes(slug);
      if (inWishlist) {
        addToast('Removed from wishlist.', 'info');
        return prev.filter((s) => s !== slug);
      } else {
        addToast('Saved to wishlist.', 'success');
        return [...prev, slug];
      }
    });
  };

  // Customizer Handlers
  const updateCustomizer = (updates: Partial<CustomArrangementState>) => {
    setCustomizer((prev) => ({ ...prev, ...updates }));
  };

  const resetCustomizer = () => {
    setCustomizer(defaultCustomizer);
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        wishlist,
        isCartOpen,
        isWishlistOpen,
        toasts,
        customizer,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        setCartOpen,
        getCartTotal,
        getCartCount,
        toggleWishlist,
        setWishlistOpen,
        updateCustomizer,
        resetCustomizer,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};
