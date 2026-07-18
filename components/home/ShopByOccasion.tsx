import Image from 'next/image';
import Link from 'next/link';
import type { FeaturedOccasion } from '@/lib/occasions';

/**
 * "Shop by Occasion" — the admin's featured collection, shown between the hero and
 * New Arrivals.
 *
 * A Server Component: it's static copy + an image + a link, so it ships zero client JS
 * and keeps this above-the-fold slot cheap. The image sits in a fixed aspect box with
 * `priority`, so it reserves its space (no CLS) and doesn't lose the LCP race.
 * Renders nothing when no collection is featured.
 */
export default function ShopByOccasion({ occasion }: { occasion: FeaturedOccasion | null }) {
  if (!occasion) return null;

  const href = occasion.buttonLink?.trim() || `/occasion/${occasion.slug}`;
  const label = occasion.buttonText?.trim() || 'VIEW COLLECTION';

  return (
    <section className="py-16 md:py-24" aria-labelledby={`occasion-${occasion.id}`}>
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-10 px-6 md:px-12 lg:grid-cols-2 lg:gap-16">
        {/* Image — first on mobile, right on desktop */}
        <div className="order-1 lg:order-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream/40 shadow-[0_16px_48px_rgba(97,0,11,0.12)] md:aspect-[5/4]">
            {occasion.bannerImage ? (
              <Image
                src={occasion.bannerImage}
                alt={occasion.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-serif text-[22px] font-light text-primary/20">{occasion.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Copy */}
        <div className="order-2 lg:order-1">
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted">Shop by Occasion</p>

          <h2
            id={`occasion-${occasion.id}`}
            className="mt-4 font-serif text-[36px] font-light leading-[1.2] text-primary md:text-[48px]"
          >
            {occasion.title}
          </h2>

          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.2em] text-muted">{occasion.subtitle}</p>

          {/* Elegant divider */}
          <div className="my-7 h-px w-16 bg-divider" />

          {occasion.description && (
            <p className="max-w-xl font-sans text-[14px] leading-[1.9] text-muted md:text-[15px]">
              {occasion.description}
            </p>
          )}

          <Link href={href} className="btn-primary mt-8 inline-block px-8 py-4">
            {label}
          </Link>
        </div>
      </div>
    </section>
  );
}
