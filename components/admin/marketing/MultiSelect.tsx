"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}

/**
 * Reusable searchable multi-select used for applicable/excluded products &
 * categories across the marketing forms.
 */
export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyText = "No options",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const labelOf = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);
  const selected = value || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
    else onChange([...selected, val]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[42px] px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white flex items-center justify-between gap-2 text-left"
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {selected.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selected.map((v) => (
              <span key={v} className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 rounded-md px-2 py-0.5 text-xs">
                {labelOf.get(v) ?? v}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggle(v); }}
                  className="text-gray-400 hover:text-red-600 cursor-pointer"
                >
                  <X size={12} />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={16} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 text-sm outline-none"
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400">{emptyText}</p>
            ) : (
              filtered.map((o) => {
                const isSel = selected.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                  >
                    <span className={isSel ? "text-gray-900 font-medium" : "text-gray-600"}>{o.label}</span>
                    {isSel && <Check size={14} className="text-gray-900" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
