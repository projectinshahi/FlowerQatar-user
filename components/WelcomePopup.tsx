'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { WelcomePopupContent } from '@/lib/welcome-popup';

const SESSION_KEY = 'lebami_welcome_shown';
const OPEN_DELAY = 800; // ms after mount before the dialog appears
const BRAND_GRADIENT = 'linear-gradient(135deg, #61000B 0%, #941A2F 55%, #C45878 100%)';
// Faint handmade-paper grain (inline SVG feTurbulence — a few hundred bytes, no image asset).
const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Elegant leaf-branch line art for the paper corners. */
function LeafSprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 84C34 66 52 52 78 34" />
      <path d="M30 72C26 66 28 60 36 60C35 67 37 71 30 72Z" />
      <path d="M40 63C33 55 34 47 44 45C45 54 48 60 40 63Z" />
      <path d="M52 52C46 44 47 36 57 34C58 43 61 49 52 52Z" />
      <path d="M64 43C59 36 61 29 70 28C70 36 72 41 64 43Z" />
    </svg>
  );
}

/** Tiny filled leaf used as the divider mark. */
function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C7 8 7 16 12 22C17 16 17 8 12 2Z" />
    </svg>
  );
}

/**
 * Storefront welcome dialog — admin-managed copy, shown once per browser session.
 *
 * Behaviour: on mount (once) we check sessionStorage; if unseen, we fetch the config
 * *before* opening. Only a configured popup ever opens — so it never flashes empty and
 * fails silently when unconfigured (spec: "do not show empty popup" / "fail silently").
 * The dialog is a Client Component mounted in the layout; it ships no work to the server
 * render and only fetches when it might actually show.
 */
export default function WelcomePopup() {
  const router = useRouter();
  const [content, setContent] = useState<WelcomePopupContent | null>(null);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  // Decide-and-show, once per session.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    (async () => {
      try {
        const res = await fetch('/api/welcome-popup');
        const json = await res.json();
        if (!active || !json?.success || !json.data) return; // unconfigured → fail silently
        timer = setTimeout(() => {
          if (!active) return;
          setContent(json.data as WelcomePopupContent);
          setOpen(true);
          sessionStorage.setItem(SESSION_KEY, '1'); // mark shown for this session
        }, OPEN_DELAY);
      } catch {
        /* network error → fail silently */
      }
    })();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const explore = useCallback(() => {
    router.push('/shop');
    close();
  }, [router, close]);

  // Lock body scroll, trap focus, and handle ESC while open.
  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    // Focus the first control once the entrance settles.
    const focusTimer = setTimeout(() => focusables()[0]?.focus(), 60);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  return (
    <AnimatePresence onExitComplete={() => (closingRef.current = false)}>
      {open && content && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={close}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            aria-describedby="welcome-desc"
            initial={{ opacity: 0, scale: 0.95, y: 16, rotate: -1.6 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10, rotate: -1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18, mass: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              // Softly irregular corners = handmade paper edge.
              borderRadius: '32px 22px 34px 24px',
              // Warm ivory → cream → beige (never pure white).
              background: 'radial-gradient(130% 130% at 0% 0%, #FCF8F1 0%, #F6EEE0 52%, #EEE2CF 100%)',
              // Layered depth + soft float, with a faint inner highlight (paper sheen).
              boxShadow:
                '0 34px 60px -22px rgba(74,44,20,0.38), 0 12px 26px -14px rgba(74,44,20,0.28), inset 0 1px 0 rgba(255,255,255,0.65)',
            }}
            className="relative w-[95%] sm:w-[90%] md:w-full md:max-w-[560px] overflow-hidden border border-[#e8dcc7] p-8 sm:p-10 md:p-12"
          >
            {/* Handmade paper grain */}
            <span aria-hidden style={{ backgroundImage: PAPER_GRAIN, mixBlendMode: 'multiply' }} className="pointer-events-none absolute inset-0 opacity-[0.06]" />
            {/* Subtle crumple / fold streaks (light + shadow) */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(118deg, transparent 45%, rgba(255,255,255,0.5) 47%, transparent 49%), linear-gradient(205deg, transparent 62%, rgba(120,80,40,0.045) 64%, transparent 66%)',
              }}
            />
            {/* Soft lifted-corner shadow (bottom-right curl) */}
            <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-20 w-20" style={{ background: 'radial-gradient(circle at 100% 100%, rgba(120,80,40,0.16), transparent 62%)' }} />

            {/* Botanical corner sprigs (line art, tucked into the corners) */}
            <LeafSprig className="pointer-events-none absolute -left-1 -top-1 h-20 w-20 -rotate-6 text-primary/20 md:h-24 md:w-24" />
            <LeafSprig className="pointer-events-none absolute -bottom-1 -right-1 h-20 w-20 rotate-[168deg] text-accent/25 md:h-24 md:w-24" />

            {/* Close (X) */}
            <button
              type="button"
              onClick={close}
              aria-label="Close welcome dialog"
              className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-primary/45 transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <X size={16} />
            </button>

            {/* Gentle floating motion while open (paper drifting) */}
            <motion.div
              animate={{ y: [0, -5, 0], rotate: [0, 0.35, 0] }}
              transition={{ repeat: Infinity, duration: 6.5, ease: 'easeInOut' }}
              className="relative text-center"
            >
              {/* Fixed title */}
              <h2 id="welcome-title" className="font-serif text-[26px] font-light leading-tight text-primary md:text-[30px]">
                Welcome to Lebami,
              </h2>

              {/* Dynamic heading */}
              <p
                className="mt-2 bg-clip-text font-serif text-[19px] font-light italic leading-snug text-transparent md:text-[21px]"
                style={{ backgroundImage: BRAND_GRADIENT }}
              >
                {content.heading}
              </p>

              {/* Botanical divider */}
              <div aria-hidden className="mx-auto my-5 flex items-center justify-center gap-2.5 text-primary/30">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/25" />
                <LeafMark className="h-3.5 w-3.5" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-primary/25" />
              </div>

              {/* Dynamic description */}
              <p id="welcome-desc" className="mx-auto max-w-md font-sans text-[13.5px] leading-[1.9] text-muted">
                {content.description}
              </p>

              {/* Buttons — full width on mobile, inline on ≥sm */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={close}
                  className="w-full rounded-full border border-primary/25 bg-transparent px-7 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-primary transition-all duration-300 hover:border-primary/45 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={explore}
                  style={{ backgroundImage: BRAND_GRADIENT }}
                  className="w-full rounded-full px-7 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white shadow-[0_10px_26px_-8px_rgba(97,0,11,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-8px_rgba(97,0,11,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 sm:w-auto"
                >
                  Explore Collection
                </button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
