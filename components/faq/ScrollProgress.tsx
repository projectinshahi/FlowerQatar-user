'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/** Thin reading-progress bar pinned to the top of the page, in the brand color. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[70] h-[3px] w-full origin-left bg-gradient-to-r from-primary via-secondary to-accent"
    />
  );
}
