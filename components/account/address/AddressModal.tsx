"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/** Modal shell: centered card on desktop, bottom-sheet on mobile. Handles scroll-lock,
 *  ESC, click-outside, and a focus trap. */
export default function AddressModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(
      () => panelRef.current?.querySelector<HTMLElement>("input,button,select,textarea")?.focus(),
      40
    );
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            /*
              `dvh` where it exists, `vh` as the fallback. `vh` is pinned to the viewport
              with the browser chrome HIDDEN, so on a phone with the address bar showing a
              92vh sheet is taller than the screen and its footer - the Save button - sits
              below the fold with nothing to scroll it into view.
            */
            className="relative w-full sm:max-w-lg bg-white/95 backdrop-blur-xl shadow-2xl max-h-[92vh] supports-[max-height:92dvh]:max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-white/60"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEFEF] shrink-0">
              <h3 className="font-serif text-[20px] text-primary">{title}</h3>
              <button onClick={onClose} className="text-[#999] hover:text-primary transition-colors" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
