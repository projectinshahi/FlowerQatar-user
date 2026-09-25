import Image from '../../../components/LuxuryImage';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { getStoreCategories } from '../../../lib/store-products';

export const metadata = {
  title: 'Collections',
  description: 'Browse our preserved Eternity® rose collections by category.',
};

export const revalidate = 60;

export default async function CollectionsPage() {
  const categories = await getStoreCategories();
  // Prefer categories that actually have published products; otherwise show all active.
  const withProducts = categories.filter((c) => c.productCount > 0);
  const list = withProducts.length > 0 ? withProducts : categories;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pb-8 page-below-header font-sans text-primary">
      <Breadcrumbs items={[{ label: 'Collections', href: '/collections' }]} />

      <div className="text-center max-w-xl mx-auto mb-16 mt-4">
        <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light block mb-2">
          Atelier Curation
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-medium tracking-wide">The Collections</h1>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Discover our curated collections of Eternity® preserved rose arrangements. Choose a collection to explore its
          pieces, or enter our designer suite to craft a custom message box.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {list.map((cat) => (
          <Link
            key={cat.key}
            href={`/shop?subcategory=${cat.key}`}
            className="group relative block bg-cream overflow-hidden border border-divider/40 aspect-[4/3]"
          >
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700 ease-out transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-cream to-divider/40" />
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-500" />

            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end text-white">
              <span className="text-[10px] uppercase tracking-[0.25em] text-secondary font-semibold mb-1">
                Signature Collection
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-wide mb-2 leading-tight capitalize">
                {cat.name}
              </h2>
              <p className="text-xs text-white/95 font-light leading-relaxed mb-6">
                {cat.productCount} {cat.productCount === 1 ? 'arrangement' : 'arrangements'}
              </p>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white group-hover:text-secondary flex items-center gap-1 transition-colors duration-300">
                Explore Collection <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        ))}

        {/* Custom design suite (preserved) */}
        <Link
          href="/custom"
          className="group relative block bg-primary overflow-hidden border border-divider/40 aspect-[4/3] md:col-span-2 md:aspect-[21/9] md:min-h-[300px]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />
          <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end text-white">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/80 font-semibold mb-1">
              Design Suite
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-wide mb-3 leading-tight">
              Custom Arrangement
            </h2>
            <p className="text-xs text-white/95 font-light leading-relaxed max-w-md mb-6">
              Craft your own preserved arrangement — choose the box, roses and a personalised message.
            </p>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white group-hover:text-soft flex items-center gap-1 transition-colors duration-300">
              Enter Customizer <ArrowRight size={12} />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
