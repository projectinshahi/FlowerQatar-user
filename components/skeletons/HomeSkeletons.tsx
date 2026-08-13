/**
 * Homepage section skeletons. Each one mirrors the section it stands in for, so streaming a
 * section in never moves the ones already painted below it. Section heights are copied from:
 *  - BannerSection      h-[75vh] md:h-[95vh] lg:h-screen min-h-[600px]
 *  - ShopByOccasion     lg:grid-cols-2, aspect-[4/3] md:aspect-[5/4]
 *  - NewArrivals        py-16 md:py-24, cards at aspect-[4/5], thirds on desktop
 *  - ExploreGardens     grid-cols-2 md:grid-cols-4, aspect-[4/5], zero gap
 *  - SubscriptionPlans  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
 */
import {
  Skeleton,
  SkeletonImage,
  SkeletonParagraph,
  SkeletonRegion,
  SkeletonText,
  SkeletonTitle,
} from '@/components/ui/Skeleton';

/** Centred serif section heading, matching the 36–48px display size. */
function SectionHeading({ width = '320px' }: { width?: string }) {
  return <SkeletonTitle className="mx-auto h-10 md:h-12" width={width} />;
}

export function HeroSkeleton() {
  return (
    <SkeletonRegion label="Loading banner" className="relative w-full">
      <Skeleton className="h-[75vh] min-h-[600px] w-full md:h-[95vh] lg:h-screen" />
    </SkeletonRegion>
  );
}

export function ShopByOccasionSkeleton() {
  return (
    <SkeletonRegion label="Loading collection" className="py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-10 px-6 md:px-12 lg:grid-cols-2 lg:gap-16">
        <SkeletonImage aspect="aspect-[4/3] md:aspect-[5/4]" className="rounded-sm" />
        <div className="space-y-5">
          <SkeletonText className="h-2.5" width="26%" />
          <SkeletonTitle className="h-10 md:h-12" width="72%" />
          <SkeletonParagraph lines={3} />
          <Skeleton className="h-11 w-44 rounded-sm" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function NewArrivalsSkeleton() {
  return (
    <SkeletonRegion label="Loading new arrivals" className="bg-[#FFF6F0] py-16 md:py-24">
      <div className="mb-12 px-6 md:px-12">
        <SectionHeading width="280px" />
      </div>
      <div className="flex gap-6 overflow-hidden px-6 md:px-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-full shrink-0 space-y-3 md:w-1/3">
            <SkeletonImage aspect="aspect-[4/5]" />
            <SkeletonText width="65%" />
            <SkeletonText className="h-2.5" width="35%" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function ExploreGardensSkeleton() {
  return (
    <SkeletonRegion label="Loading gardens" className="py-16 md:py-24">
      <div className="mb-12 px-6">
        <SectionHeading width="340px" />
      </div>
      <div className="grid grid-cols-2 gap-0 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonImage key={i} aspect="aspect-[4/5]" />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function SubscriptionPlansSkeleton() {
  return (
    <SkeletonRegion label="Loading plans" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-12">
        <div className="mb-12 space-y-4 text-center">
          <SectionHeading width="300px" />
          <SkeletonText className="mx-auto h-3" width="420px" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-sm border border-divider/50 bg-white p-8">
              <SkeletonText className="h-2.5" width="30%" />
              <SkeletonTitle className="h-8" width="55%" />
              <SkeletonParagraph lines={4} />
              <Skeleton className="mt-8 h-11 w-full rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Circular category strip used by the Flower mega-menu and mobile nav. */
export function CategoryStripSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Loading categories"
      className="flex gap-4 overflow-hidden px-1 pb-1 lg:gap-5 xl:justify-center"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex w-[80px] shrink-0 flex-col items-center gap-2 p-1 md:w-[86px] lg:w-[96px]">
          <Skeleton className="h-[64px] w-[64px] rounded-full md:h-[72px] md:w-[72px] lg:h-[84px] lg:w-[84px]" />
          <SkeletonText className="h-2" width="80%" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** Text rows for the mobile navigation drawer. */
export function NavListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonRegion label="Loading menu" className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex min-h-[56px] items-center">
          <SkeletonText className="h-4" width={`${70 - i * 5}%`} />
        </div>
      ))}
    </SkeletonRegion>
  );
}
