'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Search, ShoppingCart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BB_ASSETS } from '@/lib/blushing-blooms';

/**
 * Floating glass navigation for the Blushing Blooms page.
 *
 * This page hides the shared storefront header (see the [data-bb-page] rules in globals.css),
 * so this is its only navigation. It deliberately does NOT re-implement search, cart or
 * account: those drawers are mounted once in app/(client)/layout.tsx and stay mounted here, so
 * the icons drive the same `useApp()` state the shared header drives.
 *
 * The wishlist icon links to /wishlist rather than opening a drawer — there is no wishlist
 * drawer component in the project, only the page.
 *
 * `fixed`, not `absolute`: it stays pinned over the page as it scrolls, which is what the
 * design shows (the glass pill sits over the product grid, not only over the hero). It was
 * already out of normal flow, so nothing below it shifts. Inside the quick view it is a child
 * of the dialog, which sets no transform/filter, so it pins to the viewport there too.
 */

/* 20px -> 24px, scaling with the viewport instead of stepping 24 -> 28 at one breakpoint. */
const ICON = 'h-[clamp(1.25rem,1.186rem_+_0.2614vw,1.5rem)] w-[clamp(1.25rem,1.186rem_+_0.2614vw,1.5rem)]';
const TAP =
  'flex items-center justify-center rounded-full p-1.5 transition-[color,background-color,transform] duration-150 hover:text-white active:scale-95 motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70';

/*
 * Current state, drawn the same way for both kinds of icon: the route links are "on" when the
 * page they point at is the one you are on, the drawer buttons while their drawer is open. It
 * reads as a faint chip of the same glass the pill is made of, so nothing new enters the
 * palette — the resting icons keep the white/90 they always had.
 */
const tap = (on: boolean) => `${TAP} ${on ? 'bg-white/15 text-white' : 'text-white/90'}`;

export default function BlushingNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { setCartOpen, setSearchOpen, getCartCount, isCartOpen, isSearchOpen, wishlist } = useApp();
  const cartCount = getCartCount();
  const wishlistCount = wishlist.length;

  /*
   * Exact match, not `startsWith`: both destinations are single pages, and a prefix test would
   * light Home up on every route.
   *
   * Note this nav only mounts on /shop (the listing) and /product/[slug] — every other route
   * gets the shared storefront header instead — so with today's routing neither link is ever
   * the current page. The check is here so the two links are correct if this nav is ever
   * mounted on /  or /wishlist; the reachable current-state on this page is the drawer pair
   * below. Delete these two lines rather than let them rot if that never happens.
   */
  const pathname = usePathname();
  const onHome = pathname === '/';
  const onWishlist = pathname === '/wishlist';

  /*
   * The quick view renders this nav inside a modal. Its drawers live in the storefront layout,
   * outside that modal, so they must not be opened underneath it — `onNavigate` lets the quick
   * view close itself first. Undefined on the page itself, where there is nothing to close.
   */
  const leave = () => onNavigate?.();
  const act = (fn: () => void) => () => {
    leave();
    fn();
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 sm:pt-7">
      {/*
        Glass, built in layers rather than as one flat tint.

        `bg-black/20` alone over a 12px blur ghosted whatever passed behind it — the hero
        headline came through as a washed-out double image. The blur is dialled back to 10px so
        the backdrop stays readable as itself, saturation is lifted because blurring drains
        colour, and the tint is split: a dark base that keeps the icons legible over bright
        photography, plus a faint top-down white sheen and a bright hairline along the top edge
        so the panel reads as a lit pane of glass instead of a grey box.

        Deliberately not clipped with `overflow-hidden`: the cart badge sits outside the pill.
      */}
      <nav
        aria-label="Blushing Blooms"
        className="pointer-events-auto relative isolate mx-auto flex h-[clamp(3.25rem,2.995rem_+_1.046vw,4.25rem)] max-w-[1360px] items-center justify-between rounded-[24px] border border-white/20 bg-black/20 px-[clamp(1rem,2.5vw,2.5rem)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)] backdrop-blur-[10px] backdrop-saturate-150"
      >
        {/* Sheen: brightest at the top, gone by halfway down. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-[24px] bg-gradient-to-b from-white/[0.10] via-white/[0.03] to-transparent"
        />
        {/* Lit top edge, faded at both ends so it never looks like a drawn border. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
        />
        {/* 3:2, the Figma ratio (108x72), scaled so it stops occupying the pill's full height. */}
        <Link href="/shop?category=blushing-blooms" onClick={leave} className="relative block h-[clamp(2rem,1.745rem_+_1.046vw,3rem)] w-[clamp(3rem,2.618rem_+_1.569vw,4.5rem)] shrink-0">
          <Image
            src={BB_ASSETS.logo}
            alt="Blushing Blooms"
            fill
            sizes="108px"
            priority
            className="object-contain"
          />
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/" onClick={leave} className={tap(onHome)} aria-label="Home" aria-current={onHome ? 'page' : undefined}>
            <Home className={ICON} strokeWidth={1.5} />
          </Link>
          <Link href="/wishlist" onClick={leave} className={`${tap(onWishlist)} relative`} aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'} aria-current={onWishlist ? 'page' : undefined}>
            <Heart className={ICON} strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#cc965a] px-1 text-[10px] font-medium leading-none text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={act(() => setSearchOpen(true))}
            className={tap(isSearchOpen)}
            aria-label="Search"
            aria-expanded={isSearchOpen}
            suppressHydrationWarning
          >
            <Search className={ICON} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={act(() => setCartOpen(true))}
            className={`${tap(isCartOpen)} relative`}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
            aria-expanded={isCartOpen}
            suppressHydrationWarning
          >
            <ShoppingCart className={ICON} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#cc965a] px-1 text-[10px] font-medium leading-none text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
