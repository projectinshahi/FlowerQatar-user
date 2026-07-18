'use client';

import { Search, X } from 'lucide-react';

interface FAQSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/** Premium pill search bar with live filtering (controlled). */
export default function FAQSearch({ value, onChange }: FAQSearchProps) {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6 text-primary/50">
        <Search size={18} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your questions..."
        aria-label="Search frequently asked questions"
        className="h-14 w-full rounded-full border border-divider bg-white pl-14 pr-12 font-sans text-[15px] text-primary shadow-[0_8px_30px_-12px_rgba(97,0,11,0.18)] outline-none transition-all duration-300 placeholder:text-muted/70 focus:border-primary/40 focus:shadow-[0_10px_36px_-10px_rgba(97,0,11,0.28)] focus:ring-2 focus:ring-primary/15 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-5 text-muted transition-colors hover:text-primary"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
