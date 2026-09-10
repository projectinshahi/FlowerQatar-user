'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * The one toast surface for the whole storefront, mounted in app/(client)/layout.tsx.
 *
 * It is deliberately not duplicated for Blushing Blooms: that page already raises toasts
 * through the same `addToast` (add to cart, wishlist, sign-in prompts), so it needs a skin,
 * not a second implementation. The `data-toast-*` hooks below are what app/globals.css
 * re-colours under `body:has([data-bb-page])` — the same body-level scoping the page uses for
 * the shared header and footer, since this container is mounted outside the page's subtree.
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-secondary" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-muted" />;
    }
  };

  return (
    <div className="fixed top-24 right-4 md:right-8 z-9999 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            data-toast-panel
            className="flex items-center gap-3 p-4 bg-white border border-divider shadow-xl pointer-events-auto w-full relative overflow-hidden"
          >
            {/* Top gold bar */}
            <div data-toast-bar className="absolute top-0 left-0 right-0 h-[2px] bg-secondary" />
            
            <div className="flex-shrink-0">{getIcon(toast.type)}</div>
            
            <div className="flex-grow">
              <p className="text-xs font-sans tracking-wide text-primary font-medium">
                {toast.message}
              </p>
            </div>
            
            <button
              data-toast-close
              onClick={() => removeToast(toast.id)}
              className="text-muted/50 hover:text-primary transition-colors duration-300 ml-2"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
