'use client';

import { motion, type Variants } from 'framer-motion';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

/** Small decorative floral divider (SVG line art). */
function FloralDivider() {
  return (
    <motion.div variants={item} className="mx-auto flex items-center justify-center gap-3 text-primary/40">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-primary/30" />
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M12 2C9.5 6 9.5 10 12 13C14.5 10 14.5 6 12 2Z" />
        <path d="M12 13C8.7 11 5 11.4 3 14C6.3 16 10 15.6 12 13Z" />
        <path d="M12 13C15.3 11 19 11.4 21 14C17.7 16 14 15.6 12 13Z" />
        <path d="M12 13V22" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-primary/30" />
    </motion.div>
  );
}

export default function FAQHero() {
  return (
    <motion.header variants={container} initial="hidden" animate="show" className="text-center">
      <motion.p variants={item} className="font-sans text-[11px] font-medium uppercase tracking-[0.3em] text-accent">
        Support &amp; Guidance
      </motion.p>

      <motion.h1
        variants={item}
        className="mt-4 font-serif text-[40px] font-light leading-[1.1] text-primary sm:text-[52px] md:text-[64px]"
      >
        Frequently Asked Questions
      </motion.h1>

      <div className="mt-6">
        <FloralDivider />
      </div>

      <motion.p
        variants={item}
        className="mx-auto mt-6 max-w-2xl font-sans text-[14px] leading-relaxed text-muted md:text-[15px]"
      >
        Everything you need to know about orders, memberships, flowers, delivery, payments and customer support.
      </motion.p>
    </motion.header>
  );
}
