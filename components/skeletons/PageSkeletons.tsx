/**
 * Route-level page shells. Each reserves the real page's header + content footprint so a
 * navigation shows structure immediately instead of a blank frame or a full-screen spinner.
 */
import { Skeleton, SkeletonParagraph, SkeletonRegion, SkeletonText, SkeletonTitle } from '@/components/ui/Skeleton';
import { ProductGridSkeleton } from './ProductSkeletons';

/** Banner strip used at the top of shop / category pages. */
function PageBannerSkeleton() {
  return (
    <div className="relative w-full">
      <Skeleton className="h-[220px] w-full md:h-[300px]" />
    </div>
  );
}

/** Shop listing: banner, result count, filter sidebar, product grid. */
export function ShopPageSkeleton() {
  return (
    <SkeletonRegion label="Loading shop">
      <PageBannerSkeleton />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-12">
        <div className="mb-6 flex items-center justify-between">
          <SkeletonText className="h-3" width="140px" />
          <Skeleton className="h-10 w-40 rounded-sm" />
        </div>
        <div className="flex gap-8">
          {/* Filter rail — hidden on mobile, exactly as the real sidebar is */}
          <aside className="hidden w-56 shrink-0 space-y-6 lg:block">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <SkeletonText className="h-2.5" width="45%" />
                {Array.from({ length: 4 }).map((__, j) => (
                  <SkeletonText key={j} className="h-2.5" width={`${80 - j * 12}%`} />
                ))}
              </div>
            ))}
          </aside>
          <div className="min-w-0 flex-1">
            <ProductGridSkeleton count={6} />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Category / subcategory page: hero, circular subcategory strip, product grid. */
export function CategoryPageSkeleton() {
  return (
    <SkeletonRegion label="Loading category">
      <PageBannerSkeleton />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-12">
        <div className="mb-8 space-y-3 text-center">
          <SkeletonTitle className="mx-auto h-9" width="280px" />
          <SkeletonText className="mx-auto h-3" width="440px" />
        </div>
        {/* Subcategory strip */}
        <div className="mb-10 flex justify-center gap-4 overflow-hidden lg:gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex w-[80px] shrink-0 flex-col items-center gap-2 md:w-[86px] lg:w-[96px]">
              <Skeleton className="h-[64px] w-[64px] rounded-full md:h-[72px] md:w-[72px] lg:h-[84px] lg:w-[84px]" />
              <SkeletonText className="h-2" width="80%" />
            </div>
          ))}
        </div>
        <ProductGridSkeleton count={6} />
      </div>
    </SkeletonRegion>
  );
}

/** Search results page. */
export function SearchPageSkeleton() {
  return (
    <SkeletonRegion label="Loading search results" className="mx-auto w-full max-w-[1440px] px-4 py-10 md:px-12">
      <div className="mb-8 space-y-3">
        <SkeletonTitle className="h-8" width="320px" />
        <SkeletonText className="h-3" width="180px" />
      </div>
      <ProductGridSkeleton count={6} columns="grid-cols-2 lg:grid-cols-3" bordered={false} className="gap-3 md:gap-6 lg:gap-8" />
    </SkeletonRegion>
  );
}

/**
 * Generic storefront shell — the default for content routes that are mostly prose
 * (about, care, FAQ, press, policies).
 */
export function ContentPageSkeleton() {
  return (
    <SkeletonRegion label="Loading page" className="mx-auto w-full max-w-[900px] px-6 py-16 md:px-12">
      <div className="mb-10 space-y-4 text-center">
        <SkeletonTitle className="mx-auto h-10" width="360px" />
        <SkeletonText className="mx-auto h-3" width="60%" />
      </div>
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <SkeletonTitle className="h-5" width="42%" />
            <SkeletonParagraph lines={4} />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Cart / checkout: line items on the left, order summary on the right. */
export function CartPageSkeleton() {
  return (
    <SkeletonRegion label="Loading cart" className="mx-auto w-full max-w-[1280px] px-4 py-10 md:px-12">
      <SkeletonTitle className="mb-8 h-9" width="220px" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-divider/40 pb-5">
              <Skeleton className="h-28 w-24 shrink-0 rounded-sm" />
              <div className="flex-1 space-y-2.5">
                <SkeletonText width="55%" />
                <SkeletonText className="h-2.5" width="30%" />
                <Skeleton className="mt-3 h-9 w-28 rounded-sm" />
              </div>
              <SkeletonText className="h-3" width="60px" />
            </div>
          ))}
        </div>
        <div className="h-fit space-y-4 rounded-sm border border-divider/50 bg-white p-6">
          <SkeletonTitle className="h-6" width="60%" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <SkeletonText className="h-2.5" width="35%" />
              <SkeletonText className="h-2.5" width="20%" />
            </div>
          ))}
          <Skeleton className="mt-4 h-12 w-full rounded-sm" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Account area: sidebar nav + panel. */
export function AccountPageSkeleton() {
  return (
    <SkeletonRegion label="Loading account" className="mx-auto w-full max-w-[1280px] px-4 py-10 md:px-12">
      <SkeletonTitle className="mb-8 h-9" width="240px" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden space-y-2 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-sm" />
          ))}
        </aside>
        <div className="space-y-4 rounded-sm border border-divider/50 bg-white p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonText className="h-2.5" width="24%" />
              <Skeleton className="h-11 w-full rounded-sm" />
            </div>
          ))}
          <Skeleton className="mt-2 h-11 w-36 rounded-sm" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
