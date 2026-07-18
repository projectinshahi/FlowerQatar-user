import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getOccasionBySlug } from '@/lib/occasions';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import OccasionProducts from '@/components/client/occasion/OccasionProducts';

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
    <div className="flex min-h-screen flex-col pt-[140px] md:pt-[170px]">
      {/* Header */}
      <section className="mx-auto w-full max-w-[1440px] px-6 md:px-12">
        <div className="text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted">Shop by Occasion</p>
          <h1 className="mt-4 font-serif text-[36px] font-light leading-[1.2] text-primary md:text-[48px]">
            {occasion.title}
          </h1>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.2em] text-muted">{occasion.subtitle}</p>
          {occasion.description && (
            <p className="mx-auto mt-6 max-w-2xl font-sans text-[14px] leading-[1.9] text-muted md:text-[15px]">
              {occasion.description}
            </p>
          )}
        </div>

        {occasion.bannerImage && (
          <div className="relative mt-10 aspect-[21/9] w-full overflow-hidden rounded-sm bg-cream/40 md:aspect-[24/7]">
            <Image
              src={occasion.bannerImage}
              alt={occasion.title}
              fill
              sizes="(max-width: 768px) 100vw, 1440px"
              priority
              className="object-cover"
            />
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
