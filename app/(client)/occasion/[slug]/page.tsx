import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOccasionBySlug } from '@/lib/occasions';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import OccasionProducts from '@/components/client/occasion/OccasionProducts';
import OccasionBanner from '@/components/OccasionBanner';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const occasion = await getOccasionBySlug(slug);
  if (!occasion) return { title: `Collection Not Found | ${SITE_NAME}` };

  const description = occasion.description || occasion.subtitle;
  const url = absoluteUrl(`/occasion/${occasion.slug}`);

  return {
    title: `${occasion.title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: occasion.title,
      description,
      url,
      images: occasion.bannerImage ? [{ url: occasion.bannerImage }] : undefined,
    },
  };
}

export default async function OccasionPage({ params }: Props) {
  const { slug } = await params;
  const occasion = await getOccasionBySlug(slug);

  if (!occasion) notFound();

  return (
    /*
     * --site-header-h is the fixed header's measured height (it grows with the offers bar). With a
     * banner the page starts exactly there, so the video meets the navbar with no gap; without
     * one, page-below-header adds the usual breathing room above the title.
     */
    <div
      className={`flex min-h-screen flex-col ${
        occasion.bannerImage ? 'pt-[var(--site-header-h,120px)] md:pt-[var(--site-header-h,155px)]' : 'page-below-header'
      }`}
    >
      <section className={occasion.bannerImage ? 'w-full' : 'mx-auto w-full max-w-[1440px] px-6 md:px-12'}>
        {occasion.bannerImage ? (
          /*
           * Full-width hero with the copy on the media. On desktop it takes three quarters of the
           * visible space under the header: the whole banner is on the first screen at any window
           * height, and the top of the products below still shows, inviting the scroll.
           * Elsewhere it takes most of the screen with a floor for the copy.
           */
          <div className="relative h-[72svh] max-h-[680px] min-h-[460px] w-full overflow-hidden bg-secondary lg:h-[calc((100svh_-_var(--site-header-h,155px))_*_0.75)] lg:max-h-[720px] lg:min-h-[440px]">
            <OccasionBanner url={occasion.bannerImage} title={occasion.title} sizes="100vw" priority />
            {/* Darkens behind the copy so white text reads on any frame of the clip. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/55"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center sm:px-12">
              {/* Inline colour: globals.css paints every heading brand red with an unlayered rule
                  that beats Tailwind's text-white. */}
              <h1
                style={{ color: '#fff' }}
                className="max-w-4xl font-serif text-[34px] font-light leading-[1.15] drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)] sm:text-[44px] md:text-[56px] lg:text-[64px]"
              >
                {occasion.title}
              </h1>
              {occasion.subtitle && (
                <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.25em] text-white/85 sm:mt-5 sm:text-[12px]">
                  {occasion.subtitle}
                </p>
              )}
              {occasion.description && (
                <p className="mx-auto mt-5 max-w-2xl font-sans text-[14px] leading-[1.8] text-white/90 sm:mt-6 md:text-[16px]">
                  {occasion.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="font-serif text-[36px] font-light leading-[1.2] text-primary md:text-[48px]">
              {occasion.title}
            </h1>
            <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.2em] text-muted">{occasion.subtitle}</p>
            {occasion.description && (
              <p className="mx-auto mt-6 max-w-2xl font-sans text-[14px] leading-[1.9] text-muted md:text-[15px]">
                {occasion.description}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Products — same grid the shop uses, same ProductCard */}
      <section className="mx-auto mt-12 w-full max-w-[1440px] px-6 pb-24 md:px-12">
        <OccasionProducts products={occasion.products} />
      </section>
    </div>
  );
}
