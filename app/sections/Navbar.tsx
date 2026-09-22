'use client'
import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { motion, AnimatePresence, type Transition, type Variants } from 'framer-motion'
import { Menu, X, ShoppingBag, ChevronRight, ArrowLeft, Search, Heart, User, Phone, MapPin, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useApp } from '../../context/AppContext'
import TopAnnouncementBar from '../../components/TopAnnouncementBar'
import type { CategoryType } from '@prisma/client'
import type { NavCategory, NavItem } from '../../lib/category-config'
import LanguageToggle from '../../components/LanguageToggle'

const leftLinks = ['CONTACT US']

/* ─────────────── Mega menu data ───────────────
 * The six categories + their subcategories now come from the database (admin-managed)
 * via the `menu` prop. Layout per category: 'list' (text links + hero image),
 * 'strip' (Flower — circular image strip + list + hero), 'tiles' (Explore — image grid).
 * Every link is a real SEO route; the decorative hero art is code-config (see lib/subcategories).
 */

// Shared open/close motion: opacity + transform only (GPU accelerated), 240ms.
const MEGA_TRANSITION: Transition = { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
const MEGA_PANEL_ID = 'mega-menu-panel'

// Collection strip: tiles fade/rise in 40ms apart as the panel opens.
const STRIP_CONTAINER: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const STRIP_ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
}

/** One category row: GPU-accelerated text shift + arrow reveal on hover. */
const MegaLink = memo(function MegaLink({
  label,
  href,
  isHovered,
  onHover,
  onLeave,
  onNavigate,
}: {
  label: string
  href: string
  isHovered?: boolean
  onHover?: () => void
  onLeave?: () => void
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      className={`group/link flex min-h-[42px] items-center justify-between gap-3 rounded-md px-3 py-2 font-serif text-[15px] md:text-[16px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 ${
        isHovered
          ? 'bg-secondary/5 text-primary'
          : 'text-secondary hover:bg-secondary/5 hover:text-primary'
      }`}
    >
      <span
        className={`transition-transform duration-200 will-change-transform ${
          isHovered ? 'translate-x-1.5 font-medium text-primary' : 'group-hover/link:translate-x-1.5'
        }`}
      >
        {label}
      </span>
      <ChevronRight
        size={14}
        strokeWidth={1.5}
        aria-hidden="true"
        className={`transition-all duration-200 ${
          isHovered
            ? 'translate-x-0 opacity-100 text-primary'
            : '-translate-x-1 opacity-0 group-hover/link:translate-x-0 group-hover/link:opacity-60'
        }`}
      />
    </Link>
  )
})

/**
 * Collection strip — the first row of the Flower panel. Centred while it fits; once there are
 * more subcategories than the width holds it scrolls horizontally at every size.
 *
 * It used to be `overflow-visible` + `justify-center` on xl: with more items than fit, centring
 * pushed the first ones past the left edge where nothing could reach them, and there was no
 * scroll at all. The auto margins on the first/last item centre without that overflow (unlike
 * justify-content). Mouse users scroll it with the wheel; there are no arrow buttons.
 */
const CategoryStrip = memo(function CategoryStrip({
  items,
  hoveredItem,
  onHover,
  onLeave,
  onNavigate,
}: {
  items: NavItem[]
  hoveredItem?: NavItem | null
  onHover?: (item: NavItem) => void
  onLeave?: () => void
  onNavigate?: () => void
}) {
  // The first item stays highlighted as default only if no specific item is currently hovered.
  const active = hoveredItem ? hoveredItem.name : (items[0]?.name ?? '')

  const railRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    // A mouse wheel only scrolls vertically; turn it sideways while the strip can still move,
    // and hand it back to the page at either end. Native listener: React's onWheel is passive.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const before = el.scrollLeft
      el.scrollLeft += e.deltaY
      if (el.scrollLeft !== before) e.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <motion.ul
      ref={railRef}
      variants={STRIP_CONTAINER}
      initial="hidden"
      animate="show"
      className="flex gap-4 lg:gap-5 overflow-x-auto snap-x snap-proximity scroll-px-4 md:scroll-px-6 px-4 md:px-6 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((c) => {
        const isActive = active === c.name
        return (
          <motion.li key={c.href} variants={STRIP_ITEM} className="shrink-0 snap-start first:ml-auto last:mr-auto">
            <Link
              href={c.href}
              onClick={onNavigate}
              onMouseEnter={() => onHover?.(c)}
              onMouseLeave={onLeave}
              onFocus={() => onHover?.(c)}
              onBlur={onLeave}
              aria-current={isActive ? 'true' : undefined}
              className="group/cat flex w-[80px] md:w-[86px] lg:w-[96px] flex-col items-center gap-2 rounded-sm p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
            >
              <span
                className={`relative block h-[64px] w-[64px] md:h-[72px] md:w-[72px] lg:h-[84px] lg:w-[84px] overflow-hidden rounded-full border transition-all duration-300 ease-out will-change-transform group-hover/cat:scale-[1.08] group-hover/cat:border-primary group-hover/cat:shadow-[0_10px_28px_rgba(97,0,11,0.18)] ${
                  isActive
                    ? 'border-primary shadow-[0_0_0_3px_rgba(97,0,11,0.08),0_8px_24px_rgba(97,0,11,0.16)] scale-[1.04]'
                    : 'border-primary/8 shadow-sm'
                }`}
              >
                {c.image ? (
                  <Image src={c.image} alt={c.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-cream font-serif text-[20px] text-primary/25">
                    {c.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="flex min-h-[26px] flex-col items-center gap-1">
                <span
                  className={`text-center text-[10px] uppercase leading-tight tracking-[0.12em] transition-colors duration-300 ${
                    isActive ? 'font-semibold text-primary' : 'font-medium text-primary/75 group-hover/cat:text-primary'
                  }`}
                >
                  {c.name}
                </span>
                <span
                  className={`block h-[1px] w-4 origin-center bg-primary transition-transform duration-300 ${
                    isActive ? 'scale-x-100' : 'scale-x-0 group-hover/cat:scale-x-100'
                  }`}
                />
              </span>
            </Link>
          </motion.li>
        )
      })}
    </motion.ul>
  )
})

/** Desktop mega panel: (Flower) collection strip on top, then category list (left) + hero image (right). */
/** Desktop mega panel: (Flower) collection strip on top, or standard list (left) + dynamic hover preview image (right). */
const MegaPanel = memo(function MegaPanel({ cat, onNavigate }: { cat: NavCategory; onNavigate?: () => void }) {
  const [hoveredItem, setHoveredItem] = useState<NavItem | null>(null)
  const isStrip = cat.layout === 'strip'

  // Strip layout (Flower): only render the circular category strip, cleanly centered
  if (isStrip && cat.items.length > 0) {
    return (
      // Full width: the strip scrolls edge to edge instead of stopping at the page margins.
      <div className="w-full py-6 md:py-8">
        <CategoryStrip items={cat.items} onNavigate={onNavigate} />
      </div>
    )
  }

  // Standard category menus (Gift Combos, Shop By Occasion, Blushing Blooms):
  const listItems = cat.items
  const displayImage = hoveredItem?.hoverImage || hoveredItem?.image || cat.hero?.image || null
  const displayAlt = hoveredItem?.name || cat.hero?.alt || cat.label
  const displayTitle = hoveredItem?.name || cat.hero?.alt || cat.label
  const isSpecificHover = Boolean(hoveredItem && (hoveredItem.hoverImage || hoveredItem.image))

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-12 pt-5 pb-6 md:pb-8">
      <div className="grid items-center gap-6 md:gap-10 lg:gap-14 grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] py-2">
        <div className={`grid gap-x-8 gap-y-1 ${listItems.length > 6 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {listItems.map((item) => (
            <MegaLink
              key={item.href}
              label={item.name}
              href={item.href}
              isHovered={hoveredItem?.name === item.name}
              onHover={() => setHoveredItem(item)}
              onLeave={() => setHoveredItem(null)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        {/* Dynamic aspect box: shows the hovered subcategory's hover image with smooth animation */}
        {(displayImage || cat.hero) && (
          <div className="relative mx-auto w-full max-w-[480px]">
            <div
              className={`relative overflow-hidden rounded-2xl bg-secondary/5 shadow-[0_16px_48px_rgba(97,0,11,0.12)] border border-primary/10 ${
                cat.hero?.aspect ?? 'aspect-[16/10]'
              } ${cat.hero?.width ?? 'w-full'}`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayImage || 'fallback-hero'}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt={displayAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 480px"
                      className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-cream font-serif text-2xl text-primary/30">
                      {cat.label}
                    </div>
                  )}

                  {/* Gradient vignette for luxurious contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                  {/* Bottom badge displaying current hovered subcategory */}
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between pointer-events-none text-white">
                    <div>
                      <p className="font-serif text-lg md:text-xl font-medium tracking-wide drop-shadow-md">
                        {displayTitle}
                      </p>
                      {isSpecificHover && (
                        <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-white/80 drop-shadow-sm mt-0.5">
                          View Products →
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

/* ─── Mobile drawer styling tokens (kept in one place so rows stay identical) ─── */
const DRAWER_EASE = [0.4, 0, 0.2, 1] as const
const SCROLL_PANEL =
  'absolute inset-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
const PRIMARY_ROW =
  'group/row flex w-full min-h-[56px] items-center justify-between gap-4 rounded-sm py-3 text-left transition-colors duration-200 active:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40'
const PRIMARY_LABEL =
  'font-serif font-light uppercase leading-[1.2] tracking-[0.18em] text-primary text-[18px] min-[360px]:text-[20px] min-[390px]:text-[22px] min-[430px]:text-[24px]'
const PRIMARY_CHEVRON =
  'shrink-0 text-primary transition-transform duration-200 group-hover/row:translate-x-1.5 group-active/row:translate-x-1.5'
const SECONDARY_ROW =
  'flex w-full min-h-[48px] items-center gap-3.5 rounded-sm font-sans text-[13px] font-normal uppercase tracking-[0.14em] text-primary transition-colors duration-200 active:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40'

/** One EXPLORE tile (square image + overlaid label) — shared by desktop grid and mobile drawer. */
const ExploreTile = memo(function ExploreTile({
  item, onNavigate, sizes,
}: { item: NavItem; onNavigate?: () => void; sizes: string }) {
  return (
    <Link href={item.href} onClick={onNavigate} className="flex flex-col items-center group overflow-hidden">
      <div className="w-full aspect-square overflow-hidden bg-secondary/5 relative rounded-sm">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill sizes={sizes} className="object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-cream font-serif text-[40px] text-primary/20">
            {item.name.charAt(0)}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-6 left-0 w-full text-center px-4">
          <span className="font-serif text-[16px] md:text-[20px] text-white tracking-wide uppercase">{item.name}</span>
        </div>
      </div>
    </Link>
  )
})

export default function Navbar({ menu }: { menu: NavCategory[] }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<CategoryType | null>(null)
  // Which category's submenu page the drawer is showing (null = root list).
  const [mobileSubmenu, setMobileSubmenu] = useState<CategoryType | null>(null)
  // Measured navbar height — the drawer starts below it so the navbar stays visible.
  const [headerH, setHeaderH] = useState(0)
  // Hover-to-open only on real pointer devices; touch/tablet uses tap-to-toggle.
  const [canHover, setCanHover] = useState(false)

  // Authenticated state
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)

  const headerRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const navItemRefs = useRef<(HTMLDivElement | null)[]>([])

  const { setCartOpen, setAccountOpen, setSearchOpen, user, setUser, addToast, getCartCount, wishlist } = useApp()
  // Reads the shared cart state, so the header count updates the moment an item is added —
  // no refresh, and no extra request.
  const cartCount = getCartCount()
  // Unique wishlisted products — independent of the cart.
  const wishlistCount = wishlist.length
  const pathname = usePathname()

  const isHomePage = pathname === '/'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  // Track the navbar's height so the drawer can start exactly below it (measured up-front,
  // so the first open never flashes over the navbar).
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const measure = () => {
      setHeaderH(el.offsetHeight)
      // Also published as a CSS variable, so layout that must sit just under this fixed header
      // (the product page's sticky gallery) follows its real height — which changes with the
      // admin's announcement bar — instead of hard-coding a number that drifts.
      document.documentElement.style.setProperty('--site-header-h', `${el.offsetHeight}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ESC closes the mega menu from anywhere.
  useEffect(() => {
    if (!activeMegaMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMegaMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeMegaMenu])

  // Mobile drawer: open on the root list, sit below the navbar, lock body scroll, ESC closes.
  useEffect(() => {
    if (!isMobileMenuOpen) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileSubmenu(null)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isMobileMenuOpen])

  // Tap/click outside closes (tablet + touch, where mouseleave never fires).
  useEffect(() => {
    if (!activeMegaMenu) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setActiveMegaMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [activeMegaMenu])

  const focusNavItem = useCallback((idx: number) => {
    navItemRefs.current[idx]?.querySelector<HTMLElement>('a, button')?.focus()
  }, [])

  const handleTriggerKey = useCallback((e: React.KeyboardEvent, idx: number, cat: NavCategory) => {
    const count = menu.length
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusNavItem((idx + 1) % count)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusNavItem((idx - 1 + count) % count)
    } else if (e.key === 'ArrowDown' && cat.items.length > 0) {
      e.preventDefault()
      setActiveMegaMenu(cat.key)
      // Panel mounts this commit; focus its first row on the next tick.
      setTimeout(() => panelRef.current?.querySelector<HTMLElement>('a')?.focus(), 0)
    } else if (e.key === 'Escape') {
      setActiveMegaMenu(null)
    }
  }, [focusNavItem, menu.length])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsAccountDropdownOpen(false);
      addToast('Successfully logged out.', 'info');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), [])
  const closeMegaMenu = useCallback(() => setActiveMegaMenu(null), [])

  const rightLinks = ['WISHLIST', 'SEARCH', user ? 'MY ACCOUNT' : 'ACCOUNT', 'CART']

  // Drawer secondary links — identical destinations/actions to before, now icon-led.
  const secondaryItems: { label: string; Icon: LucideIcon; href?: string; action?: () => void }[] = [
    { label: 'SEARCH', Icon: Search, action: () => { setSearchOpen(true); closeMobileMenu() } },
    { label: 'WISHLIST', Icon: Heart, href: '/wishlist' },
    { label: 'CART', Icon: ShoppingBag, action: () => { setCartOpen(true); closeMobileMenu() } },
    ...(user ? [] : [{ label: 'ACCOUNT', Icon: User, action: () => { setAccountOpen(true); closeMobileMenu() } }]),
    { label: 'CONTACT US', Icon: Phone, href: '/contact' },
    { label: 'BOUTIQUES', Icon: MapPin, href: '/boutiques' },
  ]

  // The active mega menu / mobile submenu resolve to a category from the DB-driven menu.
  const activeCat = activeMegaMenu ? menu.find((c) => c.key === activeMegaMenu) ?? null : null
  const submenuCat = mobileSubmenu ? menu.find((c) => c.key === mobileSubmenu) ?? null : null
  // Submenu items for mobile drawer
  const submenuItems: NavItem[] = submenuCat ? submenuCat.items : []

  // While the drawer is open the navbar must be SOLID cream: it sits above the dark scrim,
  // so the usual translucent bg-cream/95 would let the scrim tint it and no longer match the
  // drawer beneath it. Solid = navbar + drawer read as one continuous surface.
  const headerSurface = isMobileMenuOpen
    ? 'bg-cream text-secondary'
    : !isHomePage || isScrolled || isHovered || activeMegaMenu !== null || isAccountDropdownOpen
      ? 'bg-cream/95 backdrop-blur-md text-secondary'
      : 'bg-transparent text-white'

  return (
    <>
      <header
        ref={headerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setActiveMegaMenu(null); }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 flex flex-col ${headerSurface}`}
      >
        <TopAnnouncementBar />
        <div className="max-w-[1440px] mx-auto relative w-full px-4 md:px-12 pt-4 pb-4 flex flex-col justify-between">

          {/* Mobile Menu Button */}
          <button
            className="md:hidden absolute top-4 left-4 z-30"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-drawer"
            suppressHydrationWarning
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Cart Icon — same live count as the desktop trigger. */}
          <button
            className="md:hidden absolute top-4 right-4 z-30 p-1"
            onClick={() => setCartOpen(true)}
            aria-label={cartCount > 0 ? `Open cart, ${cartCount} item${cartCount === 1 ? '' : 's'}` : 'Open cart'}
            suppressHydrationWarning
          >
            <span className="relative block">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-1.5 min-w-[16px] rounded-full bg-primary px-1 text-center font-sans text-[9px] font-semibold leading-4 text-white tabular-nums">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </span>
          </button>

          {/* Top row — left links · logo · right links.
              Flex (not absolute) so the groups can never overlap the logo at any width;
              the equal flex-1 sides keep the logo optically centred on every screen.

              z-20 puts this row above the two mobile corner buttons, and on a phone its
              flex-1 columns are empty but still full-width — so they covered the menu and
              cart buttons and swallowed every tap. Those two are z-30 for that reason; keep
              them above this row. */}
          <div className="relative z-20 flex items-center gap-3 mb-3 md:mb-4">

          {/* Top Left Links (Desktop) */}
          <div
            className="flex flex-1 min-w-0 items-center gap-3 lg:gap-6 xl:gap-8 z-10"
            onMouseEnter={() => setActiveMegaMenu(null)}
          >
            <div className="hidden md:flex items-center gap-3 lg:gap-6 xl:gap-8 whitespace-nowrap">
              {/* Language switch leads the left cluster, ahead of CONTACT US. The wrapper is
                  already `hidden md:flex`, so the toggle inherits desktop-only visibility and
                  the mobile drawer keeps carrying its own copy. */}
              <LanguageToggle />
              {leftLinks.map((link) => {
                const href = link === 'CONTACT US' ? '/contact' : link === 'BOUTIQUES' ? '/boutiques' : '#';
                return <NavLink key={link} href={href}>{link}</NavLink>;
              })}
            </div>
          </div>

          {/* Logo */}
          <div
            className="shrink-0 flex flex-col items-center justify-center z-0"
            onMouseEnter={() => setActiveMegaMenu(null)}
          >
            <Link href="/" className="flex items-center group">
              <span className="font-serif text-3xl md:text-[30px] lg:text-[36px] font-normal tracking-[0.2em] whitespace-nowrap">LEBAMI</span>
            </Link>
          </div>

          {/* Top Right Links (Desktop) — wrapper mirrors the left side so both flex-1 columns
              stay equal and the logo is centred at every width (incl. mobile, where the inner
              link rows are hidden but the columns still balance). */}
          <div
            className="flex flex-1 min-w-0 items-center justify-end z-10"
            onMouseEnter={() => setActiveMegaMenu(null)}
          >
            <div className="hidden md:flex items-center gap-2.5 lg:gap-6 xl:gap-8 whitespace-nowrap">
            {rightLinks.map((link) => (
              <div key={link} className="relative group">
                {/*
                  WISHLIST navigates, so it stays a link. The rest open panels — they are
                  actions, not navigation, and used to be <Link href="#"> with
                  preventDefault(). That reads as a broken link to assistive tech and to
                  anyone middle-clicking it, so they are real buttons now.
                */}
                {link === 'WISHLIST' ? (
                  <NavLink href="/wishlist">
                    {link}
                    {/* Live wishlist count — same badge as the cart's below. */}
                    {wishlistCount > 0 && (
                      <motion.span
                        key={wishlistCount}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        className="absolute -right-3.5 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-sans text-[9px] font-semibold leading-[18px] text-white tabular-nums shadow-sm ring-1 ring-white/40"
                      >
                        {wishlistCount > 9 ? '9+' : wishlistCount}
                        <span className="sr-only"> items in wishlist</span>
                      </motion.span>
                    )}
                  </NavLink>
                ) : (
                  <NavTrigger
                    isOpen={link === 'MY ACCOUNT' ? isAccountDropdownOpen : false}
                    onClick={() => {
                      if (link === 'CART') setCartOpen(true);
                      else if (link === 'ACCOUNT') setAccountOpen(true);
                      else if (link === 'MY ACCOUNT') setIsAccountDropdownOpen(!isAccountDropdownOpen);
                      else if (link === 'SEARCH') setSearchOpen(true);
                    }}
                  >
                    {link}
                    {/*
                      Live cart count. "(3)" inside the label read as part of the word and was
                      easy to miss; a badge pinned to the corner is the shape people already
                      scan for, and matches the one the mobile header uses.

                      `key={cartCount}` remounts the badge whenever the number changes, so it
                      pops once on add — the notification the flat text never gave. No extra
                      state: the key change IS the trigger.
                    */}
                    {link === 'CART' && cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        className="absolute -right-3.5 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-sans text-[9px] font-semibold leading-[18px] text-white tabular-nums shadow-sm ring-1 ring-white/40"
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                        <span className="sr-only"> items in cart</span>
                      </motion.span>
                    )}
                  </NavTrigger>
                )}

                {/* Account Dropdown for Logged in Users */}
                {link === 'MY ACCOUNT' && (
                  <AnimatePresence>
                    {isAccountDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={(e) => { e.stopPropagation(); setIsAccountDropdownOpen(false); }}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 top-[30px] w-48 bg-cream border border-secondary/20 shadow-xl py-2 flex flex-col z-50"
                        >
                        <div className="px-5 py-3 border-b border-secondary/10 mb-2">
                          <p className="font-serif text-sm text-primary capitalize truncate">Hi, {user?.firstName}</p>
                        </div>
                        {/* Profile + Orders only. Addresses and Subscriptions stay reachable
                            from the account sidebar; this menu is deliberately short. */}
                        <Link href="/account/profile" onClick={() => setIsAccountDropdownOpen(false)} className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors hover:bg-secondary/5">PROFILE</Link>
                        <Link href="/account/orders" onClick={() => setIsAccountDropdownOpen(false)} className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors hover:bg-secondary/5">MY ORDERS</Link>
                        <button onClick={handleLogout} className="text-left px-5 py-2 mt-2 border-t border-secondary/10 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors hover:bg-secondary/5 w-full">
                          LOGOUT
                        </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
            </div>
          </div>

          </div>

          {/* Sub Navigation (Desktop) */}
          <nav
            aria-label="Main"
            className={`hidden md:flex flex-wrap justify-center gap-x-6 gap-y-2 lg:gap-x-12 w-full z-10 transition-opacity duration-500`}
          >
            {menu.map((cat, idx) => {
              const hasMenu = cat.items.length > 0
              const isOpen = activeMegaMenu === cat.key
              return (
                <div
                  key={cat.key}
                  ref={(el) => { navItemRefs.current[idx] = el }}
                  onMouseEnter={() => { if (canHover) setActiveMegaMenu(hasMenu ? cat.key : null) }}
                  onKeyDown={(e) => handleTriggerKey(e, idx, cat)}
                  className="cursor-pointer whitespace-nowrap"
                >
                  {hasMenu ? (
                    <NavTrigger
                      isOpen={isOpen}
                      onClick={() => setActiveMegaMenu(isOpen ? null : cat.key)}
                    >
                      {cat.label}
                    </NavTrigger>
                  ) : (
                    <NavLink href={cat.href}>{cat.label}</NavLink>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Mega Menu — single panel stays mounted while switching between items (no flicker) */}
        <AnimatePresence>
          {activeCat && (
            <motion.div
              ref={panelRef}
              id={MEGA_PANEL_ID}
              role="region"
              aria-label={`${activeCat.label} menu`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={MEGA_TRANSITION}
              className="absolute top-full left-0 w-full bg-cream/95 backdrop-blur-md border-t border-secondary/20 shadow-lg text-secondary will-change-[opacity,transform]"
            >
              {activeCat.layout === 'tiles' ? (
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-8 md:py-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-[1080px] mx-auto">
                    {activeCat.items.map((item) => (
                      <ExploreTile key={item.href} item={item} onNavigate={closeMegaMenu} sizes="(max-width: 640px) 100vw, 33vw" />
                    ))}
                  </div>
                </div>
              ) : (
                <MegaPanel cat={activeCat} onNavigate={closeMegaMenu} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Scrim */}
            <motion.div
              key="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: 'easeInOut' }}
              onClick={closeMobileMenu}
              aria-hidden="true"
              // z-40 keeps the scrim under the navbar (z-50) so the logo/close/cart stay visible.
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            />

            {/* Drawer — starts below the navbar (z-[45] < header z-50) so the logo, the
                close (X) and the cart icon stay visible and usable while it's open. */}
            <motion.div
              key="drawer"
              id="mobile-drawer"
              role="dialog"
              aria-label="Main menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.32, ease: DRAWER_EASE }}
              className="md:hidden fixed bottom-0 left-0 z-[45] flex w-[88%] max-w-[400px] flex-col bg-cream shadow-2xl will-change-transform"
              style={{ top: headerH, paddingBottom: 'env(safe-area-inset-bottom)' }}
            >

              {/* Root list ⇄ submenu page */}
              <div className="relative flex-1 overflow-hidden">
                <AnimatePresence initial={false}>
                  {submenuCat ? (
                    <motion.div
                      key="submenu"
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ duration: 0.28, ease: DRAWER_EASE }}
                      className={SCROLL_PANEL}
                    >
                      <div className="px-7 pt-6 pb-14">
                        <button
                          type="button"
                          onClick={() => setMobileSubmenu(null)}
                          className="mb-8 flex min-h-[48px] items-center gap-3 rounded-sm text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                        >
                          <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" />
                          <span className="font-serif text-[18px] min-[390px]:text-[20px] font-light uppercase tracking-[0.18em]">
                            {submenuCat.label}
                          </span>
                        </button>
                        <ul className="flex flex-col gap-2">
                          {submenuItems.map((item) => (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={closeMobileMenu}
                                className={`${PRIMARY_ROW} min-h-[52px] px-1`}
                              >
                                <div className="flex items-center gap-3.5">
                                  {item.image ? (
                                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-primary/20 bg-secondary/5 shadow-xs">
                                      <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />
                                    </span>
                                  ) : (
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream font-serif text-sm font-semibold text-primary/40 border border-primary/10">
                                      {item.name.charAt(0)}
                                    </span>
                                  )}
                                  <span className="font-serif text-[16px] min-[390px]:text-[17px] font-light uppercase leading-[1.2] tracking-[0.14em] text-primary">
                                    {item.name}
                                  </span>
                                </div>
                                <ChevronRight
                                  size={16}
                                  strokeWidth={1.5}
                                  aria-hidden="true"
                                  className="shrink-0 text-primary/40 transition-transform duration-200 group-hover/row:translate-x-1"
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="root"
                      initial={{ x: '-25%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '-25%', opacity: 0 }}
                      transition={{ duration: 0.28, ease: DRAWER_EASE }}
                      className={SCROLL_PANEL}
                    >
                      <div className="px-7 pt-8 pb-14">
                        {/* Primary categories — driven by the DB-backed menu */}
                        <nav aria-label="Categories">
                          <ul className="flex flex-col gap-2">
                            {menu.map((cat) => (
                              <li key={cat.key}>
                                {cat.items.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setMobileSubmenu(cat.key)}
                                    aria-haspopup="true"
                                    className={PRIMARY_ROW}
                                  >
                                    <span className={PRIMARY_LABEL}>{cat.label}</span>
                                    <ChevronRight size={19} strokeWidth={1.5} aria-hidden="true" className={PRIMARY_CHEVRON} />
                                  </button>
                                ) : (
                                  <Link href={cat.href} onClick={closeMobileMenu} className={PRIMARY_ROW}>
                                    <span className={PRIMARY_LABEL}>{cat.label}</span>
                                    <ChevronRight size={19} strokeWidth={1.5} aria-hidden="true" className={PRIMARY_CHEVRON} />
                                  </Link>
                                )}
                              </li>
                            ))}
                          </ul>
                        </nav>

                        <div className="mt-10 mb-8 h-px bg-divider" />

                        {/* Secondary */}
                        <nav aria-label="Account and support">
                          <ul className="flex flex-col gap-1">
                            {secondaryItems.map(({ label, Icon, href, action }) => (
                              <li key={label}>
                                {href ? (
                                  <Link href={href} onClick={closeMobileMenu} className={SECONDARY_ROW}>
                                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                                    <span>{label}</span>
                                  </Link>
                                ) : (
                                  <button type="button" onClick={action} className={SECONDARY_ROW}>
                                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                                    <span>{label}</span>
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </nav>

                        {/* Language switch — inside the drawer on mobile, where the header
                            has no room left beside the menu and cart buttons. */}
                        <div className="mt-8 flex items-center justify-between border-t border-divider pt-6">
                          <span className="font-sans text-[11px] uppercase tracking-[0.14em] text-primary/70">
                            Language
                          </span>
                          <LanguageToggle />
                        </div>

                        {/* Signed-in account block (unchanged destinations) */}
                        {user && (
                          <div className="mt-8 border-t border-divider pt-8">
                            <p className="mb-4 font-serif text-[17px] capitalize text-primary">Hi, {user.firstName}</p>
                            <ul className="flex flex-col gap-1">
                              <li>
                                <Link href="/account/profile" onClick={closeMobileMenu} className={SECONDARY_ROW}>
                                  <User size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                                  <span>PROFILE</span>
                                </Link>
                              </li>
                              <li>
                                <Link href="/account/orders" onClick={closeMobileMenu} className={SECONDARY_ROW}>
                                  <ShoppingBag size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                                  <span>ORDERS</span>
                                </Link>
                              </li>
                              <li>
                                <button type="button" onClick={handleLogout} className={SECONDARY_ROW}>
                                  <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                                  <span>LOGOUT</span>
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ href, children, onClick }: { href: string, children: React.ReactNode, onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <Link href={href} onClick={onClick} className="relative group font-sans text-[11px] uppercase tracking-[0.2em] pointer-events-none md:pointer-events-auto">
      {children}
      <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-current scale-x-0 origin-center group-hover:scale-x-100 transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
    </Link>
  )
}

/** Same visual language as NavLink, but a real button — it opens a panel, it doesn't navigate. */
function NavTrigger({ children, isOpen, onClick }: { children: React.ReactNode; isOpen: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-controls={MEGA_PANEL_ID}
      // Some browser extensions inject `fdprocessedid` onto buttons before hydration; ignore that diff.
      suppressHydrationWarning
      className="relative group font-sans text-[11px] uppercase tracking-[0.2em] pointer-events-none md:pointer-events-auto focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
    >
      {children}
      <span className={`absolute -bottom-1 left-0 w-full h-[1px] bg-current origin-center transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${isOpen ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
    </button>
  )
}
