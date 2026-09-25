import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

/** Public shape of the welcome popup (only what the storefront dialog needs). */
export interface WelcomePopupContent {
  heading: string;
  description: string;
}

export const WELCOME_POPUP_TAG = 'welcome-popup';

/**
 * The singleton welcome-popup config, or null when the admin hasn't set it up.
 *
 * Two layers: `cache()` de-dupes within one request, `unstable_cache` keeps the row across
 * requests. Every browser session fetched this once and waited a full 1.45s round trip to the
 * database for two strings that change a few times a year. The admin's save calls
 * publishChange('welcomePopup.updated'), which purges the tag with expire: 0, so an edit is
 * still live on the next request.
 *
 * Returns null on error so the popup fails silently — and the error is thrown inside the
 * cached function only after being caught, so a database blip is never what gets stored.
 */
const loadWelcomePopup = unstable_cache(
  async (): Promise<WelcomePopupContent | null> => {
    const row = await prisma.welcomePopup.findFirst({
      select: { heading: true, description: true },
    });
    return row ?? null;
  },
  ['welcome-popup-v1'],
  { tags: [WELCOME_POPUP_TAG], revalidate: 3600 }
);

export const getWelcomePopup = cache(async (): Promise<WelcomePopupContent | null> => {
  try {
    return await loadWelcomePopup();
  } catch (e) {
    console.error('Failed to load welcome popup:', e);
    return null;
  }
});
