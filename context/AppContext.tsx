'use client';

import { fetchJson } from '@/lib/fetch-json';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product } from '../types';
import { ROSE_COLORS, BOX_COLORS } from '../data/products';
import { track } from '../lib/analytics';
import type { GreetingFont } from '../lib/validations/cart';

export interface CartItem {
  id: string; // cart line id (uuid) once persisted, or a temporary id while optimistic
  product: Product | { id?: string; name: string; slug: string; price: number; image?: string };
  quantity: number;
  roseColor: string;
  boxColor: string;
  boxShape?: string;
  size?: string;
  lid?: string;
  card?: string;
  price: number;
  variantId?: string; // Product.variants[].id (JSON)
  colorId?: string; // Product.variants[].colorVariants[].id (JSON)
  // M05: optional gift add-ons / delivery / greeting (persisted in the cart selection JSON).
  addOns?: { id: string; name: string; price: number }[];
  deliveryDate?: string;
  deliveryTime?: string;
  greetingTemplateId?: string;
  greetingMessage?: string;
  greetingStyle?: { color: string; font: GreetingFont; size: 'sm' | 'md' | 'lg' };
  calculatedPrice?: number;
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
  cartLoading: boolean;
  wishlist: string[];
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isAccountOpen: boolean;
  isSearchOpen: boolean;
  toasts: Toast[];
  customizer: CustomArrangementState;
  user: any | null;

  setUser: (user: any | null) => void;

  // Cart Actions (DB-backed via /api/cart)
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  setCartOpen: (open: boolean) => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  toggleWishlist: (productSlug: string) => void;
  setWishlistOpen: (open: boolean) => void;

  setAccountOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;

  updateCustomizer: (updates: Partial<CustomArrangementState>) => void;
  resetCustomizer: () => void;

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * How long a toast stays up before it dismisses itself. One value for every surface — the
 * cream storefront and the Blushing Blooms pages share this provider and its ToastContainer.
 */
export const TOAST_DURATION_MS = 3000;

/** Stable key for de-duping identical selections in the optimistic UI. */
const dedupKey = (i: Omit<CartItem, 'id'>) => {
  const p = (i.product as any).id || i.product.slug || 'custom';
  const sel = [i.roseColor, i.boxColor, i.boxShape, i.size, i.lid, i.card].map((v) => v || '').join('~');
  // Distinct add-ons / delivery / greeting = distinct cart line (don't merge different gift configs).
  const extra = [
    (i.addOns || []).map((a) => a.id).sort().join(','),
    i.deliveryDate || '', i.deliveryTime || '',
    i.greetingTemplateId || '', i.greetingMessage || '',
  ].join('~');
  return `${p}|${i.variantId || ''}|${i.colorId || ''}|${sel}|${extra}`;
};

/** Maps the structured server cart payload into the client CartItem shape the UI expects. */
function mapServerCart(payload: any): CartItem[] {
  if (!payload?.items) return [];
  return payload.items.map((i: any): CartItem => ({
    id: i.id,
    product: {
      id: i.product?.id || undefined,
      name: i.product?.name || 'Item',
      slug: i.product?.slug || '',
      price: i.unitPrice,
      image: i.product?.image || undefined,
    },
    quantity: i.quantity,
    roseColor: i.variant?.roseColor || '',
    boxColor: i.variant?.boxColor || '',
    boxShape: i.variant?.boxShape || undefined,
    price: i.unitPrice,
    variantId: i.variantId || undefined,
    colorId: i.variant?.id || undefined,
  }));
}

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isWishlistOpen, setWishlistOpen] = useState(false);
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [customizer, setCustomizer] = useState<CustomArrangementState>(defaultCustomizer);
  const [user, setUser] = useState<any | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION_MS);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  /* ─────────────── Cart: server-backed ─────────────── */
  const refreshCart = useCallback(async () => {
    try {
      // fetchJson, not res.json(): this runs on every page load and after every cart
      // mutation, so any non-JSON response (dev-server restart, 500 error page) used to
      // surface as an unexplained "Unexpected token '<'" SyntaxError in the console.
      const data = await fetchJson<{ success?: boolean; data?: unknown }>('/api/cart');
      if (data?.success) setCart(mapServerCart(data.data));
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Hydrate cart on mount, and again when the user changes (login merges the guest cart server-side).
  useEffect(() => {
    refreshCart();
  }, [refreshCart, user?.id]);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    // Cart requires a signed-in user — prompt guests to log in.
    if (!user) {
      addToast('Please sign in to add items to your cart.', 'info');
      setAccountOpen(true);
      return;
    }
    addToast(`Added "${item.product.name}" to your cart.`, 'success');
    track('add_to_cart', { currency: 'QAR', items: [{ item_name: item.product.name, quantity: item.quantity }] });
    // Optimistic update
    setCart((prev) => {
      const key = dedupKey(item);
      const idx = prev.findIndex((i) => dedupKey(i) === key);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
        return updated;
      }
      return [...prev, { ...item, id: `tmp-${Date.now()}` }];
    });

    const pid = (item.product as any).id;
    const productId = pid && UUID_RE.test(pid) ? pid : null;
    const selection = {
      roseColor: item.roseColor,
      boxColor: item.boxColor,
      boxShape: item.boxShape,
      size: item.size,
      lid: item.lid,
      card: item.card,
      name: item.product.name,
      slug: item.product.slug,
      image: (item.product as any).image,
      // M05 selections
      addOns: item.addOns,
      deliveryDate: item.deliveryDate,
      deliveryTime: item.deliveryTime,
      greetingTemplateId: item.greetingTemplateId,
      greetingMessage: item.greetingMessage,
      greetingStyle: item.greetingStyle,
      calculatedPrice: item.calculatedPrice,
    };

    (async () => {
      try {
        const res = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            variantId: item.variantId ?? null,
            colorId: item.colorId ?? null,
            quantity: item.quantity,
            unitPrice: item.price,
            selection,
          }),
        });
        const data = await res.json();
        if (res.ok && data?.success) setCart(mapServerCart(data.data));
        else {
          addToast(data?.error || 'Could not save to cart.', 'error');
          await refreshCart();
        }
      } catch {
        await refreshCart();
      }
    })();
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    addToast('Item removed from cart.', 'info');
    (async () => {
      try {
        const data = await fetchJson<{ success?: boolean; data?: unknown }>(
          `/api/cart/item/${itemId}`,
          { method: 'DELETE' }
        );
        if (data?.success) setCart(mapServerCart(data.data));
        else await refreshCart();
      } catch {
        await refreshCart();
      }
    })();
  };

  const updateCartQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) return removeFromCart(itemId);
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)));
    (async () => {
      try {
        const res = await fetch(`/api/cart/item/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: qty }),
        });
        const data = await res.json();
        if (data?.success) setCart(mapServerCart(data.data));
        else await refreshCart();
      } catch {
        await refreshCart();
      }
    })();
  };

  const clearCart = () => {
    setCart([]);
    (async () => {
      try {
        const data = await fetchJson<{ success?: boolean; data?: unknown }>('/api/cart', {
          method: 'DELETE',
        });
        if (data?.success) setCart(mapServerCart(data.data));
      } catch {
        /* ignore */
      }
    })();
  };

  const getCartTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  /* ─────────────── Wishlist (localStorage) ─────────────── */
  useEffect(() => {
    const stored = localStorage.getItem('v_wishlist');
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWishlist(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('v_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (slug: string) => {
    setWishlist((prev) => {
      if (prev.includes(slug)) {
        addToast('Removed from wishlist.', 'info');
        return prev.filter((s) => s !== slug);
      }
      addToast('Saved to wishlist.', 'success');
      return [...prev, slug];
    });
  };

  /* ─────────────── Auth session ─────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch session', err);
      }
    })();
  }, []);

  const updateCustomizer = (updates: Partial<CustomArrangementState>) => setCustomizer((prev) => ({ ...prev, ...updates }));
  const resetCustomizer = () => setCustomizer(defaultCustomizer);

  return (
    <AppContext.Provider
      value={{
        cart,
        cartLoading,
        wishlist,
        isCartOpen,
        isWishlistOpen,
        isAccountOpen,
        isSearchOpen,
        toasts,
        customizer,
        user,
        setUser,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        refreshCart,
        setCartOpen,
        getCartTotal,
        getCartCount,
        toggleWishlist,
        setWishlistOpen,
        setAccountOpen,
        setSearchOpen,
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
