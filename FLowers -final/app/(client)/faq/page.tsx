'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Breadcrumbs from '../../../components/Breadcrumbs';

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const FAQS: FaqItem[] = [
    {
      q: 'Are Eternity® Roses real flowers?',
      a: 'Yes, absolutely. Every Eternity® Rose is a real rose cultivated and hand-harvested at the peak of bloom in the volcanic soils of Ecuador. They are then treated with our proprietary preservation solution composed of organic glycerin and natural oils to retain cell structure.'
    },
    {
      q: 'How long do they last?',
      a: 'Our preserved arrangements are guaranteed to last at least 365 days (one full year) when kept under recommended conditions. With proper care (avoiding water and direct sunlight), they can frequently last up to three years.'
    },
    {
      q: 'Do I need to water the roses?',
      a: 'No. In fact, watering them will damage the organic preservation fluids and ruin the petals. Keep them dry and do not remove them from their designer box.'
    },
    {
      q: 'Can I design a custom message?',
      a: 'Yes. Our Custom Arrangement builder page lets you select box shapes (Round, Square, Heart), density sizes, and customize lids with branded cardboard, clear acrylic, or custom gold foil lettering.'
    },
    {
      q: 'Can I modify my order after placing it?',
      a: 'Because our local artisans handcraft each arrangement immediately upon order placement, modifications can only be made within 1 hour of placement. Please contact concierge support immediately.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'FAQ', href: '/faq' }]} />

      <h1 className="font-serif text-3xl md:text-4xl text-primary mb-10 tracking-wide mt-2">
        Frequently Asked Questions
      </h1>

      <div className="space-y-4">
        {FAQS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="border-b border-divider pb-4">
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between py-4 text-xs md:text-sm uppercase tracking-wider font-semibold text-primary hover:text-secondary transition-colors text-left"
              >
                <span>{item.q}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isOpen && (
                <div className="pb-4 pr-6 text-xs md:text-sm text-muted leading-relaxed animate-in fade-in slide-in-from-top-1 duration-300">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
