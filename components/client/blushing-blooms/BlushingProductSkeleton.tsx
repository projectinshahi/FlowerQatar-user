import { Skeleton, SkeletonRegion } from '@/components/ui/Skeleton';
import { blushingFontVars } from './fonts';

/**
 * Loading state for a Blushing Blooms product page.
 *
 * Mirrors BlushingProductDetail block for block — media panel, title, price, rating, description,
 * colour, gifts, delivery, summary, CTA — at the same sizes and breakpoints, so the real content
 * lands where the placeholders were instead of the page jumping.
 *
 * `data-bb-page` does the theming: it hides the storefront chrome (so the cream header never
 * flashes before a black page) and re-points --skeleton-base / --skeleton-sheen at the warm dark
 * pair in globals.css. The shimmer keyframe, its compositor-friendly transform and its
 * prefers-reduced-motion opt-out are the app's existing ones — only the two colours differ.
 *
 * Server component: no state, no effects, so this ships no JavaScript.
 */
export default function BlushingProductSkeleton() {
  return (
    <div
      data-bb-page
      className={`${blushingFontVars} min-h-screen bg-black font-sans text-white [overflow-x:clip]`}
    >
      {/* Navigation pill — placeheld rather than rendered, so no cart/search state is touched. */}
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

      <SkeletonRegion
        label="Loading product"
        className="mx-auto w-full max-w-[1440px] px-0 pb-16 pt-32 md:px-12 lg:pb-24 lg:pt-40"
      >
        {/* No back-control placeholder: the real one is fixed and outside this flow, so a
            block here would reserve space the loaded page never uses and shift everything
            below it up by 72px the moment the product arrives. */}
        {/* Same 62/38 split, padding and viewport-capped frame as the real page, so the
            product lands exactly where this placeholder sat instead of jumping. */}
        <div className="flex flex-col gap-0 lg:flex-row lg:items-start lg:gap-16">
          <div className="w-full px-4 md:px-0 lg:w-[62%] lg:pr-8">
            <Skeleton className="aspect-[9/10] w-full rounded-[24px] lg:mx-auto lg:w-[min(100%,calc((100vh-8rem)*0.9))]" />
          </div>

          <div className="flex w-full min-w-0 flex-col gap-8 px-6 pb-12 pt-8 md:px-0 lg:w-[38%] lg:shrink-0 lg:gap-[38px] lg:pt-0">
            {/* Title · price · rating · description */}
            <div className="flex flex-col gap-4 border-b pb-8 lg:gap-6 lg:pb-[60px]" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <Skeleton className="h-7 w-[70%] rounded-md lg:h-9" />
              <div className="flex flex-col gap-3">
                <Skeleton className="h-6 w-[38%] rounded-md lg:h-7" />
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-5 w-5 rounded-sm lg:h-6 lg:w-6" />
                    ))}
                  </div>
                  <Skeleton className="h-5 w-32 rounded-md lg:h-6" />
                </div>
              </div>
              <div className="flex max-w-[620px] flex-col gap-2">
                <Skeleton className="h-4 w-full rounded-md lg:h-5" />
                <Skeleton className="h-4 w-[82%] rounded-md lg:h-5" />
              </div>
            </div>

            {/* Colour */}
            <section className="flex flex-col gap-5 lg:gap-[26px]">
              <Skeleton className="h-4 w-40 rounded-md lg:h-5" />
              <div className="flex flex-wrap items-center gap-[18px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-9 rounded-full lg:h-10 lg:w-10" />
                ))}
              </div>
            </section>

            {/* Gifts — same 1 / 2 / 3 column rhythm as the real grid */}
            <section className="flex flex-col gap-5 lg:gap-[26px]">
              <Skeleton className="h-4 w-32 rounded-md lg:h-5" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[106px] rounded-[24px]" />
                ))}
              </div>
            </section>

            {/* Delivery date rail */}
            <section className="flex flex-col gap-5 lg:gap-[26px]">
              <Skeleton className="h-4 w-40 rounded-md lg:h-5" />
              <div className="flex gap-3 overflow-hidden lg:gap-[14px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[68px] w-[100px] shrink-0 rounded-[12px]" />
                ))}
              </div>
            </section>

            {/* Greeting cards */}
            <section className="flex flex-col gap-5 lg:gap-[32px]">
              <Skeleton className="h-4 w-44 rounded-md lg:h-5" />
              <div className="flex flex-wrap gap-[9px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[76px] min-w-[140px] flex-1 rounded-[24px] sm:flex-none sm:w-[191px] lg:h-[92px]" />
                ))}
              </div>
            </section>

            {/* Wishing font rail */}
            <section className="flex flex-col gap-5 lg:gap-[26px]">
              <Skeleton className="h-4 w-40 rounded-md lg:h-5" />
              <div className="flex gap-3 overflow-hidden lg:gap-[14px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[78px] w-[100px] shrink-0 rounded-[12px]" />
                ))}
              </div>
            </section>

            {/* Summary + call to action */}
            <section className="flex flex-col gap-4 lg:gap-[16px]">
              <Skeleton className="h-[132px] w-full rounded-[24px] lg:h-[150px]" />
              <Skeleton className="h-12 w-full rounded-[24px] lg:h-10" />
            </section>
          </div>
        </div>
      </SkeletonRegion>
    </div>
  );
}
