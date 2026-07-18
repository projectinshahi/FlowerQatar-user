'use client';

import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

/** Premium empty state shown when a search matches no questions. */
export default function FAQEmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex max-w-md flex-col items-center py-20 text-center"
    >
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-cream">
        <span aria-hidden className="absolute inset-0 rounded-full bg-primary/5 blur-xl" />
        <SearchX size={38} strokeWidth={1.2} className="relative text-primary/60" />
      </div>
      <h3 className="font-serif text-[26px] font-light text-primary">No matching questions</h3>
      <p className="mt-2 font-sans text-[14px] leading-relaxed text-muted">
        {query
          ? <>No results for <span className="font-medium text-primary">“{query}”</span>. Try searching with different keywords.</>
          : 'Try searching with different keywords.'}
      </p>
    </motion.div>
  );
}
