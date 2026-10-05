import Link from 'next/link';
import type { FeaturedOccasion } from '@/lib/occasions';
import OccasionBanner from '@/components/OccasionBanner';

/**
 * "Shop by Occasion" — the admin's featured collection, shown between the hero and
 * New Arrivals.
 *
 * A Server Component: it's static copy + an image + a link, so it ships zero client JS.
 * The image sits in a fixed aspect box, so it reserves its space (no CLS). Not `priority`:
 * the hero above is at least 75% of the screen, so this is never the largest paint and a
 * preload here only competed with the hero's.
 * Renders nothing when no collection is featured.
 */
export default function ShopByOccasion({ occasion }: { occasion: FeaturedOccasion | null }) {
  if (!occasion) return null;

  const href = occasion.buttonLink?.trim() || `/occasion/${occasion.slug}`;
  const label = occasion.buttonText?.trim() || 'VIEW COLLECTION';

  return (
    <section className="py-12 sm:py-16 md:py-24" aria-labelledby={`occasion-${occasion.id}`}>
      {/* Tighter gutters and gap on a phone — 24px of padding either side of a 360px screen
          leaves the copy column noticeably cramped. */}
      {/*
        Mobile reads: heading → video → supporting copy, which is the DOM order below, so no
        `order-*` classes are needed there.

        On lg the same three blocks are placed explicitly — heading and copy stacked in the
        left column, media spanning both rows on the right — which reproduces the original
        two-column layout without duplicating the heading for each breakpoint.
      */}
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 px-5 sm:gap-10 sm:px-6 md:px-12 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-4">
        {/* Heading + subheading — the pair stays together, above the media on mobile and at
            the top of the left column on desktop. Splitting them would leave the subtitle
            orphaned below the video, away from the title it belongs to. */}
        <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
          <h2
            id={`occasion-${occasion.id}`}
            className="font-serif text-[28px] font-light leading-[1.2] text-primary min-[400px]:text-[32px] sm:text-[36px] md:text-[48px]"
          >
            {occasion.title}
          </h2>


          {/* `break-words` so a long unbroken subtitle cannot push the row sideways and
              introduce horizontal scroll on a narrow screen. */}
          <p className="mt-3 break-words font-sans text-[11px] uppercase tracking-[0.18em] text-muted sm:mt-4 sm:tracking-[0.2em]">
            {occasion.subtitle}
          </p>
        </div>

        {/* Media — directly below the heading on mobile, right column on desktop. */}
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          {/* Landscape rectangle with a curve that grows with the viewport — a fixed small
              radius reads as a hard edge on a large screen and as a blob on a phone. */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-cream/40 shadow-[0_16px_48px_rgba(97,0,11,0.12)] sm:rounded-2xl md:aspect-[4/3] lg:aspect-[5/4] lg:rounded-3xl">
            {occasion.bannerImage ? (
              <OccasionBanner
                url={occasion.bannerImage}
                title={occasion.title}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-serif text-[22px] font-light text-primary/20">{occasion.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Supporting copy — below the media on mobile, under the heading on desktop. */}
        <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
          {/* Elegant divider. No top margin on mobile: the media above already provides the
              separation, and the grid gap handles the rest. */}
          <div className="mb-5 h-px w-16 bg-divider sm:mb-7 lg:mt-2" />

          {occasion.description && (
            <p className="max-w-xl font-sans text-[14px] leading-[1.8] text-muted sm:leading-[1.9] md:text-[15px]">
              {occasion.description}
            </p>
          )}

          {/* Full-width on a phone: a centred, edge-to-edge CTA is the expected mobile
              pattern and gives a far larger tap target than an inline button. */}
          <Link
            href={href}
            className="btn-primary mt-7 block w-full px-8 py-4 text-center sm:mt-8 sm:inline-block sm:w-auto"
          >
            {label}
          </Link>
        </div>
      </div>
    </section>
  );
}
