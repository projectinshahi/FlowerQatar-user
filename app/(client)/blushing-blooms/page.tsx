import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LuxuryImage from '@/components/LuxuryImage';
import { jedira } from '@/components/client/blushing-blooms/fonts';
import { BB_ASSETS } from '@/data/blushing-blooms';
import { getBlushingBloomsContent } from '@/lib/blushing-blooms';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'Blushing Blooms — Coming Soon',
  description: 'Blushing Blooms by Lebami is coming soon. Something beautiful is about to bloom.',
  path: '/blushing-blooms',
});

// The Blushing Blooms accents (GOLD in components/client/blushing-blooms/ui.tsx, ACCENT in
// BlushingBloomsClient). Restated because ui.tsx is a client module a server page cannot read.
const GOLD = '#cc965a';
const PINK = '#e05ba2';

/**
 * Blushing Blooms — Coming Soon. The navbar links here; the shop itself stays live at
 * /shop?category=blushing-blooms.
 *
 * Deliberately NOT a [data-bb-page] surface: that attribute hides the shared header and footer
 * (globals.css), which this page keeps. The hero is the one an admin set for the Blushing
 * Blooms shop, so the two always match; the shipped art stands in if none is set.
 */
export default async function BlushingBloomsComingSoonPage() {
  const { heroMedia } = await getBlushingBloomsContent();

  return (
    <section
      aria-labelledby="bb-coming-soon-title"
      className={`${jedira.variable} relative isolate flex items-center justify-center overflow-hidden bg-black text-white mt-[var(--site-header-h,120px)] min-h-[max(30rem,calc(100svh_-_var(--site-header-h,120px)))] md:mt-[var(--site-header-h,155px)] md:min-h-[max(34rem,calc(100svh_-_var(--site-header-h,155px)))]`}
    >
      <LuxuryImage
        src={heroMedia || BB_ASSETS.hero}
        alt=""
        fill
        priority
        sizes="100vw"
        // A portrait screen crops this landscape art down to its dark centre; leaning right
        // brings the large lily into frame. From sm up it is centred, like the shop hero.
        className="-z-10 object-cover object-[68%_50%] sm:object-center"
      />
      {/* The shop hero's soft pool behind the copy: invisible on the dark shipped art, and what
          keeps the white type readable if a brighter hero is uploaded later. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(60% 50% at 50% 45%, rgba(0,0,0,0.55), rgba(0,0,0,0) 75%)' }}
      />

      <div className="flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6">
        {/* The colour is inline: globals.css paints every h1 maroon, and that rule outranks
            text-white (the same reason the About hero sets it inline). */}
        <h1 id="bb-coming-soon-title" style={{ color: '#FFFFFF' }} className="flex flex-col items-center">
          <span className="font-jedira text-[clamp(2rem,6vw,4rem)] leading-tight tracking-[0.1em]">
            Blushing Blooms
          </span>
          <span
            aria-hidden="true"
            className="my-[clamp(1rem,2.5vw,1.5rem)] block h-px w-16 sm:w-24"
            style={{ backgroundColor: GOLD }}
          />
          {/* Trailing tracking is cancelled with a matching negative margin so the line centres. */}
          <span className="font-serif text-[clamp(2.25rem,8vw,5.25rem)] font-light uppercase leading-none tracking-[0.18em] [margin-right:-0.18em]">
            Coming Soon
          </span>
        </h1>

        <p
          className="mt-[clamp(1.25rem,3vw,2rem)] font-serif text-[clamp(1.125rem,2.4vw,1.5rem)] italic leading-snug"
          style={{ color: PINK }}
        >
          Something beautiful is about to bloom.
        </p>

        <Link
          href="/"
          className="mt-[clamp(2rem,5vw,3rem)] inline-flex h-11 items-center justify-center gap-3 rounded-[24px] px-7 text-[12px] font-medium uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          style={{ backgroundColor: GOLD }}
        >
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          Back to home
        </Link>
      </div>
    </section>
  );
}
