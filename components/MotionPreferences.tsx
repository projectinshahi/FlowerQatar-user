'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Honour the operating system's "reduce motion" setting for every framer-motion animation on the
 * storefront (drawers, carousels, section reveals). With `reducedMotion="user"`, framer-motion
 * drops transform and layout movement for those visitors and keeps simple fades; nothing changes
 * for anyone else.
 */
export default function MotionPreferences({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
