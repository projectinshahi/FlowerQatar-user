'use client';

import { fetchJson } from '@/lib/fetch-json';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Product } from '../types';
import { ROSE_COLORS, BOX_COLORS } from '../data/products';
import { track } from '../lib/analytics';
import { syncToggle } from '../lib/wishlist';
import { addToast } from '../lib/toasts';
import type { GreetingFont } from '../lib/validations/cart';
import type { CartPayload } from '../lib/services/cart';

/** The signed-in shopper, exactly as /api/auth/me selects it. */
export interface SessionUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  role: string;
  profileImage: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
}

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
  wishlist: string[]; // wishlisted product slugs — use for heart state and the count
  wishlistItems: Product[]; // full products from the server — use for the wishlist page
  wishlistLoading: boolean;
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isAccountOpen: boolean;
  isSearchOpen: boolean;
  customizer: CustomArrangementState;
  user: SessionUser | null;

  setUser: (user: SessionUser | null) => void;

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
  refreshWishlist: () => Promise<void>;
  setWishlistOpen: (open: boolean) => void;

  setAccountOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;

  updateCustomizer: (updates: Partial<CustomArrangementState>) => void;
  resetCustomizer: () => void;

  /** Lives in lib/toasts; exposed here so components keep calling useApp().addToast. */
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
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

/** Stable key for de-duping identical selections in the optimistic UI. */
const dedupKey = (i: Omit<CartItem, 'id'>) => {
  const p = i.product.id || i.product.slug || 'custom';
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
function mapServerCart(payload: CartPayload | null | undefined): CartItem[] {
  if (!payload?.items) return [];
  return payload.items.map((i): CartItem => ({
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
    // Gifts/add-ons priced by the server, so the cart UI can show what is on the line.
    addOns: Array.isArray(i.addOns) ? i.addOns : undefined,
  }));
}

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isWishlistOpen, setWishlistOpen] = useState(false);
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [customizer, setCustomizer] = useState<CustomArrangementState>(defaultCustomizer);
  const [user, setUser] = useState<SessionUser | null>(null);

  /*
   * Which identity the cart and wishlist currently hold, as opposed to which one React has
   * rendered. `undefined` means nothing has been loaded yet.
   *
   * Both reads below used to be keyed on `user?.id`, which starts undefined and becomes the
   * real id when /api/auth/me answers. That transition is not a change of shopper — the very
   * first /api/cart and /api/wishlist requests already carried the session cookie, so the
   * server had answered as the signed-in user all along — but it re-ran both effects, so every
   * page load by a signed-in shopper made four requests and four database round trips where two
   * would do. This ref is written the moment the probe resolves, before React re-renders, so
   * that transition matches and is skipped while a real sign-in or sign-out still does not.
   */
  const loadedForUserId = useRef<string | null | undefined>(undefined);

  /* ─────────────── Cart: server-backed ─────────────── */
  const refreshCart = useCallback(async () => {
    try {
      // fetchJson, not res.json(): this runs on every page load and after every cart
      // mutation, so any non-JSON response (dev-server restart, 500 error page) used to
      // surface as an unexplained "Unexpected token '<'" SyntaxError in the console.
      const data = await fetchJson<{ success?: boolean; data?: CartPayload }>('/api/cart');
      if (data?.success) setCart(mapServerCart(data.data));
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setCartLoading(false);
    }
  }, []);

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

    const pid = item.product.id;
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
      image: item.product.image,
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
        const data = await fetchJson<{ success?: boolean; data?: CartPayload }>(
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
        const data = await fetchJson<{ success?: boolean; data?: CartPayload }>('/api/cart', {
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

  /* ─────────────── Wishlist: server-backed ─────────────── */
  // `wishlist` (slugs) drives every heart and the badge; `wishlistItems` (products) drives the
  // wishlist page. Both come from /api/wishlist; `wishlist` additionally carries optimistic
  // clicks that are still in flight, tracked in `pendingWishlist` (slug → desired state).
  const pendingWishlist = useRef(new Map<string, boolean>());

  const applyServerWishlist = useCallback((items: Product[]) => {
    /*
     * Keep the previous arrays when the server confirms what the optimistic click already
     * rendered — the common case. Setting equal-but-new arrays re-renders every consumer of this
     * context (each product card, both drawers, the navbar) for no visible change, which is pure
     * main-thread work on the click the shopper is waiting on.
     *
     * Compared by id/slug only. That cannot serve a stale product: the wishlist page — the one
     * surface reading `wishlistItems` fields — refetches on every open.
     */
    setWishlistItems((prev) =>
      prev.length === items.length && prev.every((p, i) => p.id === items[i].id) ? prev : items
    );
    setWishlist((prev) => {
      const slugs = new Set(items.map((p) => p.slug));
      pendingWishlist.current.forEach((want, slug) => (want ? slugs.add(slug) : slugs.delete(slug)));
      const next = [...slugs];
      return prev.length === next.length && prev.every((s, i) => s === next[i]) ? prev : next;
    });
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const data = await fetchJson<{ success?: boolean; data?: { items?: Product[] } }>('/api/wishlist');
      if (data?.success) applyServerWishlist(data.data?.items ?? []);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setWishlistLoading(false);
    }
  }, [applyServerWishlist]);

  /*
   * Loads the cart and the wishlist, on mount and again whenever the shopper actually changes.
   * Logging in merges the guest cart into the account server-side and swaps in that account's
   * wishlist, so neither can be left as it was; the session probe merely resolving is not such
   * a change, and `loadedForUserId` is what tells the two apart.
   */
  useEffect(() => {
    const id = user?.id ?? null;
    if (loadedForUserId.current === id) return;
    loadedForUserId.current = id;
    refreshCart();
    refreshWishlist();
  }, [user?.id, refreshCart, refreshWishlist]);

  /** Slugs with a request in flight; a click on one only updates `pendingWishlist`. */
  const inflightWishlist = useRef(new Set<string>());

  const toggleWishlist = (slug: string) => {
    if (!user) {
      addToast('Please sign in to save items to your wishlist.', 'info');
      setAccountOpen(true);
      return;
    }

    const add = !wishlist.includes(slug);
    // Record the intent and move the heart NOW — every click counts, including one that lands
    // while the previous request is still out. Dropping those made the heart look stuck.
    pendingWishlist.current.set(slug, add);
    setWishlist((prev) =>
      add ? (prev.includes(slug) ? prev : [...prev, slug]) : prev.filter((s) => s !== slug)
    );

    // A loop is already running for this product; it will pick the new intent up.
    if (inflightWishlist.current.has(slug)) return;
    inflightWishlist.current.add(slug);

    (async () => {
      let unauthorized = false;
      const { ok, result } = await syncToggle(slug, pendingWishlist.current, async (s, wishlisted) => {
        try {
          const res = await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: s, wishlisted }),
          });
          const data = await res.json().catch(() => null);
          if (res.status === 401) unauthorized = true;
          return res.ok && data?.success ? { items: (data.data?.items ?? []) as Product[], wishlisted } : null;
        } catch {
          return null;
        }
      });
      inflightWishlist.current.delete(slug);

      if (ok && result) {
        applyServerWishlist(result.items);
        addToast(result.wishlisted ? 'Saved to wishlist.' : 'Removed from wishlist.', result.wishlisted ? 'success' : 'info');
        return;
      }
      if (!ok) {
        // Failed: drop the optimistic overlay and show what the server actually holds.
        pendingWishlist.current.delete(slug);
        await refreshWishlist();
        addToast('Could not update your wishlist.', 'error');
        if (unauthorized) setAccountOpen(true);
      }
    })();
  };

  /* ─────────────── Auth session ─────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          // Synchronous, so it lands before the re-render this setUser schedules: the effect
          // above then sees the id it already loaded and does not repeat the work.
          loadedForUserId.current = data.user?.id ?? null;
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
        wishlistItems,
        wishlistLoading,
        isCartOpen,
        isWishlistOpen,
        isAccountOpen,
        isSearchOpen,
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
        refreshWishlist,
        setWishlistOpen,
        setAccountOpen,
        setSearchOpen,
        updateCustomizer,
        resetCustomizer,
        addToast,
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
