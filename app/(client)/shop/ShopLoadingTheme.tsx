'use client';

import { useSearchParams } from 'next/navigation';
import { ShopPageSkeleton } from '@/components/skeletons/PageSkeletons';
import BlushingListingSkeleton from '@/components/client/blushing-blooms/BlushingListingSkeleton';

/**
 * Picks the loading skeleton that matches the listing about to render.
 *
 * `loading.tsx` receives no params, so the category is read from the URL here instead — it is
 * already `?category=blushing-blooms` on that listing, so nothing extra has to be threaded
 * through. Every other category keeps the shared shop skeleton, unchanged.
 */
export default function ShopLoadingTheme() {
  const isBlushingBlooms = useSearchParams().get('category') === 'blushing-blooms';
  return isBlushingBlooms ? <BlushingListingSkeleton /> : <ShopPageSkeleton />;
}
