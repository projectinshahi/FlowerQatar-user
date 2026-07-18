"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

/** Large avatar preview with zoom-in + fade. ESC / click-outside / close button dismiss. */
export default function AvatarPreviewModal({ src, onClose }: { src: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Profile photo preview">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        className="relative"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Profile photo"
          className="max-w-[86vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain bg-white"
        />
        <button
          type="button"
          ref={closeRef}
          onClick={onClose}
          aria-label="Close preview"
          className="absolute -top-3 -right-3 bg-white text-primary rounded-full p-2 shadow-lg hover:bg-secondary hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </motion.div>
    </div>
  );
}
