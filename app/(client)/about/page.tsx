'use client';

import React from 'react';
import Image from '../../../components/LuxuryImage';
import Link from 'next/link';
import { ArrowRight, Leaf, ShieldAlert, Award, HelpingHand } from 'lucide-react';
import Breadcrumbs from '../../../components/Breadcrumbs';

export default function AboutPage() {
  const PROCESS_STEPS = [
    {
      num: '01',
      title: 'Cultivation & Harvest',
      desc: 'Our roses are grown on a private volcanic-soil farm in Ecuador, receiving optimal sunlight. They are hand-picked at their absolute peak of bloom.',
    },
    {
      num: '02',
      title: 'Sap Dehydration',
      desc: 'The natural sap is dehydrated through a slow, carefully monitored botanical cooling process, leaving the cellular layout intact.',
    },
    {
      num: '03',
      title: 'Organic Preservation',
      desc: 'The petals are infused with a mixture of biodegradable glycerin, oils, and organic pigment colors. This replaces the sap completely.',
    },
    {
      num: '04',
      title: 'Atelier Arrangement',
      desc: 'Each preserved rose is inspected, trimmed, and hand-placed by skilled floral artists in our signature French hatboxes.',
    },
  ];

  return (
    <div className="font-sans text-primary bg-white">
      {/* Hero Banner */}
      <section className="relative w-full h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=1600"
          alt="Luxury Flower arranging Workshop"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 text-center text-white px-6">
          <span className="text-xs uppercase tracking-[0.3em] text-secondary font-light mb-2 block">
            ESTABLISHED 2015
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-medium tracking-wide">
            Our Story & Heritage
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <Breadcrumbs items={[{ label: 'Our Story', href: '/about' }]} />

        {/* 1. EDITORIAL NARRATIVE */}
        <section className="py-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-[0.25em] text-secondary font-semibold block">
              The Genesis
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-wide text-primary leading-tight">
              Redefining Floral Artistry
            </h2>
            <p className="text-muted text-sm md:text-base leading-relaxed">
              Founded in New York City, Lebami was born out of a desire to create a lasting floral statement. Traditionally, fresh roses fade within days, leaving only a brief memory. Our founders sought to capture the ultimate peak of rose elegance and preserve it, enabling a floral arrangement to remain beautiful for an entire year.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              By partnering with eco-conscious volcanic farms in Ecuador and applying proprietary botanical preservation formulas, we introduced the world to the original Eternity® Rose. Over the years, our custom boxes have become a staple of premium home decor, milestone events, and luxury gifts.
            </p>
          </div>
          
          <div className="relative aspect-[4/3] bg-cream border border-divider/40 shadow-md overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1556012018-50cf53d47a24?auto=format&fit=crop&q=80&w=800"
              alt="Luxury preserve rose box in room"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </section>

        {/* 2. THE BOTANICAL PROCESS */}
        <section className="py-20 border-y border-divider my-12">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light block mb-2">
              Atelier Craftsmanship
            </span>
            <h2 className="font-serif text-3xl font-medium tracking-wide">
              The Preservation Process
            </h2>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Unveiling the scientific and design craftsmanship behind making roses bloom for 365 days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} className="bg-cream/40 border border-divider p-8 relative flex flex-col justify-between">
                <span className="font-serif text-4xl font-bold text-secondary/30 block mb-6">{step.num}</span>
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. SUSTAINABILITY COMMITMENT */}
        <section className="py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-square md:aspect-[4/3] bg-cream overflow-hidden border border-divider/40 shadow-sm order-last lg:order-first">
            <Image
              src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=800"
              alt="Natural plants field"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="space-y-6 lg:pl-6">
            <span className="text-xs uppercase tracking-[0.25em] text-secondary font-semibold block">
              Ethical Practices
            </span>
            <h2 className="font-serif text-3xl font-medium tracking-wide">
              Sustainability & Fair Trade
            </h2>
            <p className="text-muted text-xs md:text-sm leading-relaxed">
              Because our roses last for a year, their carbon footprint is significantly lower than that of fresh-cut flowers, which must be imported and discarded weekly. Furthermore, we are committed to upholding fair wages, organic cultivation, and clean water restoration on our Ecuadorian partner farms.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-3">
                <Leaf size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-primary">Eco-Friendly Preservation</h4>
                  <p className="text-[11px] text-muted leading-relaxed">All solutions are water-based, organic, non-toxic, and fully biodegradable.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <HelpingHand size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-primary">Fair Farm Wages</h4>
                  <p className="text-[11px] text-muted leading-relaxed">Upholding safe conditions and certified fair-pay metrics for agricultural workers.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Award size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-primary">Reducing Waste</h4>
                  <p className="text-[11px] text-muted leading-relaxed">One custom Lebami box replaces approximately 50-60 batches of temporary fresh bouquets.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
