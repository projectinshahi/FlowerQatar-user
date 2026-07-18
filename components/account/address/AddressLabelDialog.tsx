"use client";
/* eslint-disable react-hooks/set-state-in-effect -- resets the field when the dialog opens */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tag, X } from "lucide-react";

const SUGGESTIONS = ["Parents", "Office", "Apartment", "Villa", "Warehouse", "Friend", "Hostel", "Vacation Home", "Grandmother"];

/** Small dialog to create a custom address label. Prevents duplicates (case-insensitive). */
export default function AddressLabelDialog({
  open,
  existingLabels,
  onClose,
  onCreate,
}: {
  open: boolean;
  existingLabels: string[];
  onClose: () => void;
  onCreate: (label: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setError("");
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const taken = existingLabels.map((l) => l.trim().toLowerCase());

  const submit = () => {
    const v = value.trim();
    if (!v) return setError("Please enter a label");
    if (v.length > 30) return setError("Label is too long");
    if (taken.includes(v.toLowerCase())) return setError("You already have a label with this name");
    onCreate(v);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Create address label">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="relative bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-[#999] hover:text-primary" aria-label="Close">
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Tag size={16} className="text-primary" />
              <h3 className="font-serif text-[19px] text-primary">Custom label</h3>
            </div>
            <p className="text-[13px] text-[#888] mb-4">Name this address (e.g. Parents, Office, Villa).</p>

            <input
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Label name"
              className={`w-full rounded-lg border text-sm py-2.5 px-3 outline-none transition-colors ${error ? "border-red-400" : "border-[#E2E2E2] focus:border-primary"}`}
            />
            {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}

            <div className="flex flex-wrap gap-1.5 mt-3">
              {SUGGESTIONS.filter((s) => !taken.includes(s.toLowerCase())).slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setValue(s);
                    setError("");
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-[#E6E6E6] text-[#666] hover:border-primary hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={submit} className="bg-black text-white px-6 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors">
                Add Label
              </button>
              <button onClick={onClose} className="px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#666] hover:text-primary">
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
