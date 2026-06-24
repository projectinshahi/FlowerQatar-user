'use client';

import React from 'react';
import Image from '../../components/LuxuryImage';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';
import { COLLECTIONS } from '../../data/collections';

export default function CollectionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Collections', href: '/collections' }]} />

      {/* Hero Header */}
      <div className="text-center max-w-xl mx-auto mb-16 mt-4">
        <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light block mb-2">
          Atelier Curation
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-medium tracking-wide">
          The Collections
        </h1>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Discover our curated collections of Eternity® preserved rose arrangements. Select a shape to explore preset options, or enter our designer suite to craft a custom message box.
        </p>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {COLLECTIONS.map((col, idx) => {
          const isLg = idx === COLLECTIONS.length - 1; // Last card spans full or looks unique
          const href = col.isCustom ? '/custom' : `/shop?collection=${col.slug}`;
          return (
            <Link
              key={col.slug}
              href={href}
              className={`group relative block bg-cream overflow-hidden border border-divider/40 aspect-[4/3] ${
                isLg ? 'md:col-span-2 aspect-[21/9] min-h-[300px]' : ''
              }`}
            >
              <Image
                src={col.image}
                alt={col.name}
                fill
                className="object-cover transition-transform duration-700 ease-out transform group-hover:scale-105"
                sizes={isLg ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-500" />

              {/* Text overlays */}
              <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end text-white">
                <span className="text-[10px] uppercase tracking-[0.25em] text-secondary font-semibold mb-1">
                  {col.isCustom ? 'Design Suite' : 'Signature Collection'}
                </span>
                <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-wide mb-3 leading-tight">
                  {col.name}
                </h2>
                <p className="text-xs text-white/95 font-light leading-relaxed max-w-md mb-6 line-clamp-2 md:line-clamp-none">
                  {col.description}
                </p>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white group-hover:text-secondary flex items-center gap-1 transition-colors duration-300">
                  {col.isCustom ? 'Enter Customizer' : 'Explore Collection'} <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
