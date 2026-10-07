'use client';

import type { FAQCategory } from '@/types/faq';

interface FAQCategoryTabsProps {
  categories: FAQCategory[];
  active: FAQCategory | null;
  onSelect: (category: FAQCategory) => void;
  /** 'pills': a horizontally scrollable row (phones, tablets). 'sidebar': a vertical list (desktop). */
  variant?: 'pills' | 'sidebar';
}

/**
 * FAQ category navigation. The active entry is driven by the page's scroll-spy, and selecting one
 * scrolls to its section.
 */
export default function FAQCategoryTabs({ categories, active, onSelect, variant = 'pills' }: FAQCategoryTabsProps) {
  if (variant === 'sidebar') {
    return (
      <nav aria-label="FAQ categories">
        <ul className="border-l border-divider">
          {categories.map((category) => {
            const isActive = active === category;
            return (
              <li key={category}>
                <button
                  type="button"
                  onClick={() => onSelect(category)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative -ml-px block w-full border-l-2 py-2.5 pl-5 pr-2 text-left font-sans text-[13px] tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    isActive
                      ? 'border-primary font-semibold text-primary'
                      : 'border-transparent text-muted hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {category}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="FAQ categories" className="w-full">
      <ul className="flex snap-x gap-2.5 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const isActive = active === category;
          return (
            <li key={category} className="snap-start">
              <button
                type="button"
                onClick={() => onSelect(category)}
                aria-current={isActive ? 'true' : undefined}
                className={`whitespace-nowrap rounded-full border px-4 py-2 font-sans text-[12px] font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  isActive
                    ? 'border-primary bg-primary text-white shadow-[0_8px_20px_-8px_rgba(97,0,11,0.5)]'
                    : 'border-divider bg-cream text-primary hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md'
                }`}
              >
                {category}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
