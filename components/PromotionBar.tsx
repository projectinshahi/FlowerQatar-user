'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Active-promotions bar pinned to the bottom of the home banner. Mirrors the site's
 * announcement-bar style (taupe strip, rotating message with prev/next chevrons), but the
 * slides are the admin's live promotion titles. Auto-advances; chevrons only show for 2+.
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
      className="absolute inset-x-0 bottom-0 z-10 flex h-10 items-center justify-between bg-[#b0aca7] px-4 text-white md:px-12"
    >
      {hasControls ? (
        <button
          onClick={prev}
          className="p-1 transition-colors duration-300 hover:text-white/70"
          aria-label="Previous offer"
          suppressHydrationWarning
        >
          <ChevronLeft size={16} />
        </button>
      ) : (
        <span className="w-6" aria-hidden />
      )}

      <div className="relative flex h-full flex-1 items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={safeIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="absolute flex w-full flex-wrap items-center justify-center gap-2 px-8 text-center font-sans text-[10px] uppercase tracking-[0.15em] md:text-[11px]"
          >
            <span className="font-medium">{title}</span>
            <span className="hidden h-1 w-1 rounded-full bg-white/50 sm:inline" aria-hidden />
            <Link href="/shop" className="underline underline-offset-4 transition-colors duration-300 hover:text-white/70">
              Shop Now
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {hasControls ? (
        <button
          onClick={next}
          className="p-1 transition-colors duration-300 hover:text-white/70"
          aria-label="Next offer"
          suppressHydrationWarning
        >
          <ChevronRight size={16} />
        </button>
      ) : (
        <span className="w-6" aria-hidden />
      )}
    </div>
  );
}
