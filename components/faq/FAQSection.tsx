'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { FAQCategory, FAQItem } from '@/types/faq';
import FAQAccordion from './FAQAccordion';

interface FAQSectionProps {
  category: FAQCategory;
  description: string;
  items: FAQItem[];
  openId: number | null;
  onToggle: (id: number) => void;
  /** Optional content between the heading and the questions (e.g. membership showcase). */
  intro?: ReactNode;
  /** Ref setter + scroll offset supplied by the page for scroll-spy + sticky nav. */
  registerRef: (el: HTMLElement | null) => void;
  scrollMt: number;
}

/** A premium category section: accent-lined heading, description, optional intro, cards. */
export default function FAQSection({
  category, description, items, openId, onToggle, intro, registerRef, scrollMt,
}: FAQSectionProps) {
  return (
    <section
      ref={registerRef}
      aria-labelledby={`section-${category}`}
      style={{ scrollMarginTop: scrollMt }}
      className="scroll-mt-40"
    >
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="flex items-center gap-3">
          <span className="h-px w-8 bg-accent" aria-hidden="true" />
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.25em] text-accent">{category}</span>
        </span>
        <h2 id={`section-${category}`} className="mt-3 font-serif text-[28px] font-light leading-tight text-primary md:text-[34px]">
          {category}
        </h2>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-muted">{description}</p>
      </motion.div>

      {intro && <div className="mt-8">{intro}</div>}

      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <FAQAccordion key={item.id} item={item} isOpen={openId === item.id} onToggle={() => onToggle(item.id)} />
        ))}
      </div>
    </section>
  );
}
