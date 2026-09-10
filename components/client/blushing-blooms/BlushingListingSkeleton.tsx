import { Skeleton, SkeletonRegion } from '@/components/ui/Skeleton';
import { blushingFontVars } from './fonts';

/**
 * Loading state for the Blushing Blooms listing (/shop?category=blushing-blooms).
 *
 * Mirrors BlushingBloomsClient section for section at the same breakpoints — navigation pill,
 * hero with its pillar bar, the wide gifting banner, the filter row, the product grid and the
 * video feature — so the real content lands where the placeholders were instead of the page
 * reflowing under the reader.
 *
 * `data-bb-page` does the theming: it hides the storefront chrome, so the cream header never
 * flashes ahead of a black page, and re-points --skeleton-base / --skeleton-sheen at the warm
 * dark pair in globals.css. The shimmer keyframe, its compositor-friendly transform and its
 * prefers-reduced-motion opt-out are the app's existing ones — only the two colours differ.
 *
 * Server component: no state, no effects, so this ships no JavaScript.
 */

/** One product card placeholder, matching BlushingProductCard's geometry. */
function CardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-[18px] rounded-[28px] border border-[rgba(43,43,43,0.8)] bg-[#1e1918] px-3 pb-7 pt-[19px] lg:rounded-[40px]">
      <Skeleton className="aspect-[42/41] w-full rounded-t-[20px] lg:rounded-t-[28px]" />
      <div className="flex w-full flex-col gap-3 px-1">
        <Skeleton className="h-4 w-[60%] rounded-md lg:h-5" />
        <Skeleton className="h-5 w-[38%] rounded-md lg:h-6" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-full sm:h-5 sm:w-5" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BlushingListingSkeleton() {
  return (
    <div
      data-bb-page
      className={`${blushingFontVars} bg-black font-sans text-white [overflow-x:clip]`}
    >
      {/* Navigation pill — placeheld, so no cart or search state is touched while loading. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 sm:pt-7">
        <div className="mx-auto flex h-[60px] max-w-[1360px] items-center justify-between rounded-[24px] border border-white/10 bg-black/20 px-4 backdrop-blur-[10px] sm:h-[72px] sm:px-10">
          <Skeleton className="h-9 w-[54px] rounded-md sm:h-[46px] sm:w-[108px]" />
          <div className="flex items-center gap-3 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-6 rounded-full sm:h-7 sm:w-7" />
            ))}
          </div>
        </div>
      </div>

      <SkeletonRegion label="Loading Blushing Blooms">
        {/* Hero */}
        <section className="relative flex min-h-[640px] flex-col overflow-hidden lg:min-h-[804px]">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-10 pt-32 sm:pt-40">
            <Skeleton className="h-9 w-[280px] rounded-md sm:h-12 sm:w-[420px] lg:h-16 lg:w-[560px]" />
            <div className="flex w-full max-w-[562px] flex-col items-center gap-2">
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-[76%] rounded-md" />
            </div>
          </div>

          {/* Brand pillars */}
          <div className="relative z-10 px-4 pb-6 sm:px-6 lg:pb-[42px]">
            <div className="mx-auto grid w-full max-w-[1364px] grid-cols-2 gap-x-6 gap-y-6 rounded-[24px] bg-[rgba(224,91,162,0.12)] px-5 py-6 sm:gap-x-10 lg:grid-cols-4 lg:px-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-[9px]">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full lg:h-10 lg:w-10" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-[80%] rounded-md" />
                    <Skeleton className="h-3 w-[60%] rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Secondary banner */}
        <section className="relative w-full overflow-hidden lg:aspect-[1440/630]">
          <div className="relative aspect-[3/2] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
          <div className="relative px-6 pb-14 pt-4 sm:px-10 lg:absolute lg:inset-0 lg:flex lg:items-center lg:px-[140px] lg:py-0">
            <div className="flex max-w-[461px] flex-col gap-5">
              <Skeleton className="h-3 w-32 rounded-md" />
              <Skeleton className="h-8 w-[70%] rounded-md lg:h-10" />
              <Skeleton className="h-8 w-[85%] rounded-md lg:h-10" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-[72%] rounded-md" />
              </div>
              <Skeleton className="h-10 w-[214px] rounded-[24px]" />
            </div>
          </div>
        </section>

        {/* Listing */}
        <section className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 lg:px-5 lg:py-[60px]">
          {/* Filter / sort row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
            {/* Same three columns as the real toolbar — filters left, the centred count, sort
                right — so the row does not shift when the listing replaces this. */}
            <div className="flex flex-1 items-center">
              <Skeleton className="h-5 w-32 rounded-md" />
            </div>
            <Skeleton className="h-5 w-24 rounded-md" />
            <div className="flex flex-1 items-center justify-end gap-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-8 w-[180px] rounded-[24px] sm:w-[200px]" />
            </div>
          </div>

          <div className="flex flex-col gap-[10px]">
            {/* First six products */}
            <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>

            {/* Video feature */}
            <Skeleton className="my-10 aspect-[4/5] w-full rounded-[28px] sm:aspect-[16/9] lg:my-[60px] lg:aspect-[1400/705] lg:rounded-[40px]" />
          </div>
        </section>
      </SkeletonRegion>
    </div>
  );
}
