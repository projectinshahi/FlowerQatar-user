'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Active-promotions bar pinned to the bottom of the home banner. Mirrors the site's
 * announcement-bar style (taupe strip, rotating message with prev/next chevrons), driven by
 * the admin's live promotion titles. Auto-advances; chevrons only show for 2+.
 *
 * Mobile-safe: the bar uses a MIN height and the message FLOWS (wraps + centers) instead of
 * being absolutely positioned, so long promo sentences never get clipped on narrow screens.
 * "· Shop Now" is hidden on the smallest screens to keep the title readable.
 */
export default function PromotionBar({ items }: { items: string[] }) {
  const slides = items.map((t) => t.trim()).filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIndex((p) => (p + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const safeIndex = index % slides.length;
  const title = slides[safeIndex];
  const next = () => setIndex((p) => (p + 1) % slides.length);
  const prev = () => setIndex((p) => (p - 1 + slides.length) % slides.length);
  const hasControls = slides.length > 1;

  return (
    <div
      aria-label="Current offers"
      className="absolute inset-x-0 bottom-0 z-10 flex min-h-[40px] items-center justify-between gap-1 bg-[#b0aca7] px-1.5 py-1.5 text-white sm:px-4 md:px-12"
    >
      {hasControls ? (
        <button
          onClick={prev}
          aria-label="Previous offer"
          suppressHydrationWarning
          className="flex shrink-0 items-center p-1 transition-colors duration-300 hover:text-white/70"
        >
          <ChevronLeft size={16} />
        </button>
      ) : (
        <span className="w-4 shrink-0 sm:w-6" aria-hidden />
      )}

      <div className="flex flex-1 items-center justify-center">
        <motion.div
          key={safeIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center font-sans text-[10px] uppercase leading-tight tracking-[0.1em] sm:tracking-[0.15em] md:text-[11px]"
        >
          <span className="font-medium">{title}</span>
          <span className="hidden h-1 w-1 rounded-full bg-white/50 sm:inline" aria-hidden />
          <Link
            href="/shop"
            className="hidden underline underline-offset-4 transition-colors duration-300 hover:text-white/70 sm:inline"
          >
            Shop Now
          </Link>
        </motion.div>
      </div>

      {hasControls ? (
        <button
          onClick={next}
          aria-label="Next offer"
          suppressHydrationWarning
          className="flex shrink-0 items-center p-1 transition-colors duration-300 hover:text-white/70"
        >
          <ChevronRight size={16} />
        </button>
      ) : (
        <span className="w-4 shrink-0 sm:w-6" aria-hidden />
      )}
    </div>
  );
}
