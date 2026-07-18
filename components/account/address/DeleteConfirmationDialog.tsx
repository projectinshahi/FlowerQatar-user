"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteConfirmationDialog({
  open,
  title = "Delete this address?",
  message = "This action cannot be undone.",
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => (busy ? undefined : onCancel())}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="relative bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center"
          >
            <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 className="text-red-500" size={20} />
            </div>
            <h3 className="font-serif text-[19px] text-primary mb-1">{title}</h3>
            <p className="text-[13px] text-[#888] mb-6">{message}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onConfirm}
                disabled={busy}
                className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.14em] hover:bg-red-600 transition-colors disabled:bg-red-300"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
              <button
                onClick={onCancel}
                disabled={busy}
                className="px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#666] hover:text-primary disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
