'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { memo } from 'react';
import type { FAQItem } from '@/types/faq';

interface FAQAccordionProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * A single luxury FAQ card. The whole card is the toggle button; the answer opens
 * with a height + fade animation and the chevron rotates. Numbering ("01"–"23")
 * comes from the item id. `whitespace-pre-line` preserves any line breaks in the answer.
 */
function FAQAccordion({ item, isOpen, onToggle }: FAQAccordionProps) {
  const panelId = `faq-panel-${item.id}`;
  const buttonId = `faq-button-${item.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`group rounded-3xl border bg-white/80 backdrop-blur-sm transition-all duration-300 ${
        isOpen
          ? 'border-primary/40 shadow-[0_18px_44px_-20px_rgba(97,0,11,0.28)]'
          : 'border-divider/70 shadow-[0_6px_20px_-14px_rgba(97,0,11,0.18)] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_-20px_rgba(97,0,11,0.25)]'
      }`}
    >
      <h3>
        <button
          type="button"
          id={buttonId}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 rounded-3xl p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 md:p-7"
        >
          <span className="mt-0.5 shrink-0 font-serif text-[15px] font-medium text-accent" aria-hidden="true">
            {String(item.id).padStart(2, '0')}
          </span>
          <span className="flex-1 font-serif text-[17px] font-medium leading-snug text-primary md:text-[19px]">
            {item.question}
          </span>
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-divider/80 text-primary transition-all duration-300 ${
              isOpen ? 'rotate-180 border-primary/40 bg-cream' : 'group-hover:border-primary/30'
            }`}
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </span>
        </button>
      </h3>

      {/* Answer stays mounted (crawlable + screen-reader accessible); height animates. */}
      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-7 pl-[3.75rem] md:px-7 md:pb-8 md:pl-[4.5rem]">
          <div className="h-px w-full bg-divider/60" />
          <p className="mt-4 whitespace-pre-line font-sans text-[14px] leading-[1.9] text-muted md:text-[15px]">
            {item.answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default memo(FAQAccordion);
