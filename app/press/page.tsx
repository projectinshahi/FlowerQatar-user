'use client';

import React from 'react';
import Image from '../../components/LuxuryImage';
import Link from 'next/link';
import { Quote, ExternalLink, ArrowRight } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';
import { PRESS_MENTIONS, CELEBRITIES } from '../../data/press';

export default function PressPage() {
  const LOGO_CLOUD = [
    'VOGUE', 'FORBES', 'BAZAAR', 'ELLE', 'COSMOPOLITAN', 'ARCHITECTURAL DIGEST', 'GQ', 'MARIE CLAIRE'
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Press & Celebrities', href: '/press' }]} />

      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-16 mt-4">
        <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light block mb-2">
          Atelier Spotlight
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-medium tracking-wide">
          Press & Placements
        </h1>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Explore coverage from leading luxury design publications and view custom arrangements styled by celebrities in their homes.
        </p>
      </div>

      {/* 1. LOGO CLOUD */}
      <section className="bg-cream border border-divider/60 py-10 px-8 text-center mb-16 rounded-none">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted mb-6 block">
          As Seen In
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-center font-serif text-muted/80 text-sm md:text-base font-bold tracking-wider">
          {LOGO_CLOUD.map((logo, idx) => (
            <div key={idx} className="hover:text-primary transition-colors duration-300">
              {logo}
            </div>
          ))}
        </div>
      </section>

      {/* 2. MEDIA GRID */}
      <section className="mb-20">
        <div className="flex flex-col mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">
            Editorial Reviews
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-primary">
            What the Editors Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PRESS_MENTIONS.map((item, idx) => (
            <div key={idx} className="bg-white border border-divider p-8 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative">
              <Quote className="text-secondary/20 absolute top-6 right-6 w-12 h-12 pointer-events-none" />
              <div className="space-y-4">
                <span className="font-serif font-bold text-lg tracking-[0.15em] text-primary">
                  {item.publication}
                </span>
                <p className="text-xs text-muted leading-relaxed italic">
                  {item.quote}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-divider/60">
                <a
                  href="https://vogue.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-secondary hover:text-primary transition-colors"
                >
                  <span>Read Article</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CELEBRITY GALLERY */}
      <section className="mb-12">
        <div className="flex flex-col mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">
            Circle of Friends
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-primary">
            Atelier Celebrity Placements
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CELEBRITIES.map((cel, idx) => (
            <div key={idx} className="group flex flex-col bg-cream border border-divider/40">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={cel.image}
                  alt={cel.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-6 left-6 text-white">
                  <span className="text-[9px] uppercase tracking-widest text-secondary font-semibold mb-1 block">
                    Favorite Palette
                  </span>
                  <h4 className="font-serif text-xl font-bold">{cel.name}</h4>
                </div>
              </div>
              <div className="p-6 bg-white border-t border-divider/40 flex-grow flex flex-col justify-between">
                <p className="text-xs text-muted leading-relaxed italic mb-6">
                  "{cel.quote}"
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-secondary hover:text-primary transition-colors"
                >
                  <span>Shop Presets</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
