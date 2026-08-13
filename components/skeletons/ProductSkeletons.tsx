/**
 * Product-shaped skeletons. Dimensions are copied from the real components so swapping in
 * data cannot shift layout:
 *  - card  → components/ProductCard.tsx
 *  - grid  → components/client/shop/ShopClient.tsx  (grid-cols-2 lg:grid-cols-3, zero gap)
 */
import {
  Skeleton,
  SkeletonImage,
  SkeletonParagraph,
  SkeletonRegion,
  SkeletonText,
  SkeletonTitle,
} from '@/components/ui/Skeleton';

/** Mirrors ProductCard: square image, then name/price row, subtitle, colour swatches. */
export function ProductCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex flex-col border-r border-b border-divider/40 ${className}`}>
      <SkeletonImage aspect="aspect-square" className="bg-[#F1EBE8]" />
      <div className="flex flex-grow flex-col bg-white p-4">
        <div className="flex items-start justify-between gap-2">
          <SkeletonText className="h-4" width="62%" />
          <SkeletonText className="h-3" width="22%" />
        </div>
        <SkeletonText className="mt-2 h-2.5" width="40%" />
        <div className="mt-3 flex items-center gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-3.5 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A grid of product placeholders. `columns` must match the real grid at every breakpoint,
 * otherwise the reflow on data arrival is exactly the jump we are trying to avoid.
 */
export function ProductGridSkeleton({
  count = 6,
  columns = 'grid-cols-2 lg:grid-cols-3',
  bordered = true,
  className = '',
}: {
  count?: number;
  columns?: string;
  bordered?: boolean;
  className?: string;
}) {
  return (
    <SkeletonRegion
      label="Loading products"
      className={`grid gap-0 ${columns} ${bordered ? 'border-l border-t border-divider/40' : ''} ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </SkeletonRegion>
  );
}

/** Compact horizontal result row — used by the search drawer. */
export function SearchResultSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonRegion label="Loading results" className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonText width="70%" />
            <SkeletonText className="h-2.5" width="35%" />
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** Full product detail page: gallery on the left, buy panel on the right, then description. */
export function ProductDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading product" className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Gallery: main image + thumbnail strip */}
        <div className="space-y-3">
          <SkeletonImage aspect="aspect-square" className="rounded-sm" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-20 shrink-0 rounded-sm" />
            ))}
          </div>
        </div>

        {/* Buy panel */}
        <div className="space-y-6 pt-2">
          <div className="space-y-3">
            <SkeletonTitle className="h-9" width="80%" />
            <SkeletonText className="h-3" width="30%" />
          </div>
          <SkeletonText className="h-6" width="26%" />

          {/* Colour / variant swatches */}
          <div className="space-y-2.5">
            <SkeletonText className="h-2.5" width="18%" />
            <div className="flex gap-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-9 rounded-full" />
              ))}
            </div>
          </div>

          {/* Quantity + actions */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-32 rounded-sm" />
            <Skeleton className="h-12 flex-1 rounded-sm" />
          </div>
          <Skeleton className="h-12 w-full rounded-sm" />

          <div className="space-y-2.5 border-t border-divider/50 pt-5">
            <SkeletonParagraph lines={3} />
          </div>

          {/* Delivery / info accordions */}
          <div className="space-y-2 border-t border-divider/50 pt-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      <div className="mt-16 space-y-5">
        <SkeletonTitle className="mx-auto h-7" width="220px" />
        <ProductGridSkeleton count={4} columns="grid-cols-2 lg:grid-cols-4" />
      </div>
    </SkeletonRegion>
  );
}
