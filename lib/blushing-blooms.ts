import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';
import { BLUSHING_BLOOMS_DEFAULTS as DEFAULTS, type BlushingBloomsContent } from '@/data/blushing-blooms';

export const BLUSHING_BLOOMS_TAG = 'blushing-blooms';

/**
 * The stored row merged over the defaults. Null/empty columns fall back, never blank out.
 * Throws, so the "fall back to DEFAULTS" path below can never be what gets cached.
 */
async function readBlushingBloomsContent(): Promise<BlushingBloomsContent> {
  const row = await prisma.blushingBloomsPage.findFirst();
  if (!row) return DEFAULTS;

  const merged = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as (keyof BlushingBloomsContent)[]) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') merged[key] = value;
  }
  return merged;
}

/*
 * Cached across requests. This page lives at /shop?category=blushing-blooms, and /shop is
 * dynamic, so the row was read fresh on every visit — a round trip to another region for copy
 * that changes when an admin edits it. That edit purges this tag (lib/live-sync.ts).
 */
const loadBlushingBloomsContent = unstable_cache(readBlushingBloomsContent, ['blushing-blooms-v1'], {
  tags: [BLUSHING_BLOOMS_TAG],
  revalidate: 3600,
});

export const getBlushingBloomsContent = cache(async (): Promise<BlushingBloomsContent> => {
  try {
    return await loadBlushingBloomsContent();
  } catch (e) {
    // Same contract as every other storefront read: log the real Prisma code, degrade quietly.
    logDbError('getBlushingBloomsContent', e);
    return DEFAULTS;
  }
});
