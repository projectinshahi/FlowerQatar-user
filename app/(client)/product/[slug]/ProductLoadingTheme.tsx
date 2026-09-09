'use client';

import { useSearchParams } from 'next/navigation';
import { ProductDetailSkeleton } from '@/components/skeletons/ProductSkeletons';
import BlushingProductSkeleton from '@/components/client/blushing-blooms/BlushingProductSkeleton';

/**
 * Picks the loading skeleton that matches the page about to render.
 *
 * `loading.tsx` is shared by every product and receives no params, so at fallback time the
 * category is not known — the product has not been fetched yet. The Blushing Blooms listing
 * therefore links with `?category=blushing-blooms`, purely as a hint for this choice.
 *
 * The hint can only ever affect which skeleton shows for one frame. The page itself branches on
 * the product's real `categoryType` from the database and ignores this parameter entirely, so a
 * forged or stale value cannot produce the wrong page — only a briefly mismatched shimmer.
 * `alternates.canonical` is already the bare `/product/[slug]`, so search engines see one URL.
 */
export default function ProductLoadingTheme() {
  const isBlushingBlooms = useSearchParams().get('category') === 'blushing-blooms';
  return isBlushingBlooms ? <BlushingProductSkeleton /> : <ProductDetailSkeleton />;
}
