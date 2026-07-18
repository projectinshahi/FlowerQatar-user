import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/** Public shape of the welcome popup (only what the storefront dialog needs). */
export interface WelcomePopupContent {
  heading: string;
  description: string;
}

/**
 * The singleton welcome-popup config, or null when the admin hasn't set it up.
 * `cache()` de-dupes within a request. Returns null on error so the popup fails silently.
 */
export const getWelcomePopup = cache(async (): Promise<WelcomePopupContent | null> => {
  try {
    const row = await prisma.welcomePopup.findFirst({
      select: { heading: true, description: true },
    });
    return row ?? null;
  } catch (e) {
    console.error('Failed to load welcome popup:', e);
    return null;
  }
});
