'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { PROMOTION_BAR_DEFAULTS, type PromotionBarTheme } from '@/lib/validations/promotion-bar';

/**
 * Active-promotions bar: pinned to the bottom of the home banner, and at the top of the header
 * everywhere else (Navbar). Taupe strip, rotating message with prev/next chevrons, driven by
 * the admin's live promotion titles. Auto-advances; chevrons only show for 2+.
 *
 * Mobile-safe: the bar uses a MIN height and the message FLOWS (wraps + centers) instead of
 * being absolutely positioned, so long promo sentences never get clipped on narrow screens.
 * "· Shop Now" is hidden on the smallest screens to keep the title readable.
 */
export default function PromotionBar({
  items,
  theme = PROMOTION_BAR_DEFAULTS,
  placement = 'banner',
}: {
  items: string[];
  /** Admin-configured colours; defaults keep the bar looking as it always did. */
  theme?: PromotionBarTheme;
  /** 'banner' overlays the bottom edge of the hero; 'header' sits in normal flow. */
  placement?: 'banner' | 'header';
}) {
  const slides = items.map((t) => t.trim()).filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIndex((p) => (p + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const safeIndex = index % slides.length;
  const next = () => setIndex((p) => (p + 1) % slides.length);
  const prev = () => setIndex((p) => (p - 1 + slides.length) % slides.length);
  const hasControls = slides.length > 1;

  return (
    <div
      aria-label="Current offers"
      style={{ backgroundColor: theme.barColor, color: theme.textColor }}
      className={`${placement === 'banner' ? 'absolute inset-x-0 bottom-0 z-10' : 'relative w-full'} flex min-h-[40px] items-center justify-between gap-1 px-1.5 py-1.5 sm:px-4 md:px-12`}
    >
      {hasControls ? (
        <button
          onClick={prev}
          aria-label="Previous offer"
          suppressHydrationWarning
          className="flex shrink-0 items-center p-1 transition-opacity duration-300 hover:opacity-70"
        >
          <ChevronLeft size={16} />
        </button>
      ) : (
        <span className="w-4 shrink-0 sm:w-6" aria-hidden />
      )}

      {/*
        Every slide stays mounted and only the active one is shown. Re-keying a fresh node each
        tick replaced Google Translate's Arabic with new English before it could translate it.
        The active slide keeps the flowing layout; inactive ones overlay it, invisible and inert.
      */}
      <div className="relative flex flex-1 items-center justify-center">
        {slides.map((slide, i) => {
          const active = i === safeIndex;
          return (
            <motion.div
              key={i}
              aria-hidden={!active}
              inert={!active}
              initial={{ opacity: 0, y: 4 }}
              animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
              transition={{ duration: active ? 0.35 : 0 }}
              className={`${active ? '' : 'pointer-events-none absolute inset-0 '}flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center font-sans text-[10px] uppercase leading-tight tracking-[0.1em] sm:tracking-[0.15em] md:text-[11px]`}
            >
              <span className="font-medium">{slide}</span>
              <span className="hidden h-1 w-1 rounded-full bg-current opacity-50 sm:inline" aria-hidden />
              <Link
                href="/shop"
                className="hidden underline underline-offset-4 transition-opacity duration-300 hover:opacity-70 sm:inline"
              >
                Shop Now
              </Link>
            </motion.div>
          );
        })}
      </div>

      {hasControls ? (
        <button
          onClick={next}
          aria-label="Next offer"
          suppressHydrationWarning
          className="flex shrink-0 items-center p-1 transition-opacity duration-300 hover:opacity-70"
        >
          <ChevronRight size={16} />
        </button>
      ) : (
        <span className="w-4 shrink-0 sm:w-6" aria-hidden />
      )}
    </div>
  );
}
