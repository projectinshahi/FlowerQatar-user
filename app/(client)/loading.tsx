import {
  HeroSkeleton,
  ShopByOccasionSkeleton,
  NewArrivalsSkeleton,
} from '@/components/skeletons/HomeSkeletons';

/**
 * Route fallback for the storefront home. Replaces the previous full-screen logo spinner:
 * the user now sees the page's real structure (hero, then the first two sections) rather
 * than a blank overlay, and the sections below stream in via their own Suspense boundaries
 * in page.tsx.
 *
 * Nested routes (shop, product, category, search, cart, account…) each declare their own
 * loading.tsx, so this only stands in for the home route and the simple content pages.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeroSkeleton />
      <ShopByOccasionSkeleton />
      <NewArrivalsSkeleton />
    </div>
  );
}
