import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';

/**
 * Content for the Blushing Blooms category page (/shop?category=blushing-blooms).
 *
 * The admin row is OPTIONAL. Everything below has a code default taken from the approved
 * design, and `getBlushingBloomsContent()` merges the row over it field by field. Three
 * consequences, all deliberate:
 *
 *  - the page's COPY reads correctly before an admin has ever opened the form,
 *  - clearing a text field restores the designed wording instead of blanking a section,
 *  - a database outage degrades to the designed copy rather than an empty page.
 *
 * Media is the exception: hero, banner and video default to EMPTY, never to stock art. An
 * unconfigured slot renders nothing at all, so the storefront can never show a picture nobody
 * chose to publish.
 *
 * Media paths are pre-encoded because the shipped filenames contain spaces and parentheses.
 */

/**
 * The shipped Blushing Blooms artwork, percent-encoded once here so no caller has to remember
 * the filenames contain spaces.
 *
 * Only `logo` is applied automatically (it is the brand mark, not content). The hero, banner and
 * video files are kept for reference — paste a path into the admin form to use one — but are NOT
 * defaulted in: an empty media field must render an empty slot, not stock art.
 */
export const BB_ASSETS = {
  hero: '/images/image%2026%20(2).png',
  banner: '/images/image%2037.png',
  logo: '/images/image%2028%20(2).png',
  video: '/images/lebami-blushing-blooms-banner-image.mp4',
} as const;

export interface BlushingBloomsContent {
  heroMedia: string;
  heroTitle: string;
  heroSubtitle: string;

  bannerMedia: string;
  bannerEyebrow: string;
  bannerTitle: string;
  bannerTitleAccent: string;
  bannerDescription: string;
  bannerCtaLabel: string;
  bannerCtaHref: string;

  videoMedia: string;
  videoTitle: string;
  videoTitleAccent: string;
  videoDescription: string;
}

const DEFAULTS: BlushingBloomsContent = {
  // Empty by design — see BB_ASSETS above. No media until an admin uploads one.
  heroMedia: '',
  heroTitle: 'Blushing Blooms',
  heroSubtitle:
    'Explore our signature boxes of preserved Eternity® Roses. Handcrafted to order and designed to bloom in your space for a full year.',

  bannerMedia: '',
  bannerEyebrow: 'CURATED WITH LOVE',
  bannerTitle: 'Gifts That',
  bannerTitleAccent: 'Speak From The Heart',
  bannerDescription:
    'From timeless blooms to indulgent treats, each gift is thoughtfully curated to create moments that last forever.',
  bannerCtaLabel: 'SHOP NOW',
  bannerCtaHref: '#blushing-blooms-products',

  videoMedia: '',
  videoTitle: "From A Little Gestures To Life's",
  videoTitleAccent: 'Biggest Moments',
  videoDescription:
    'Explore our signature boxes of preserved Eternity® Roses. Handcrafted to order and designed to bloom in your space for a full year.',
};

/** The stored row merged over the defaults. Null/empty columns fall back, never blank out. */
export const getBlushingBloomsContent = cache(async (): Promise<BlushingBloomsContent> => {
  try {
    const row = await prisma.blushingBloomsPage.findFirst();
    if (!row) return DEFAULTS;

    const merged = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS) as (keyof BlushingBloomsContent)[]) {
      const value = row[key];
      if (typeof value === 'string' && value.trim() !== '') merged[key] = value;
    }
    return merged;
  } catch (e) {
    // Same contract as every other storefront read: log the real Prisma code, degrade quietly.
    logDbError('getBlushingBloomsContent', e);
    return DEFAULTS;
  }
});

/** Exposed so the admin form can show the designed copy as placeholders. */
export const blushingBloomsDefaults = DEFAULTS;
