import React from 'react';
import Image from '../../../components/LuxuryImage';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Gift,
  Leaf,
  MessageSquareHeart,
  Sparkles,
  Truck,
} from 'lucide-react';
import Breadcrumbs from '../../../components/Breadcrumbs';

/**
 * Our Story — the page behind the OUR STORY half of the home triptych.
 *
 * Every claim here is one the rest of the site already makes: delivery across Qatar, same-day
 * for eligible locations, order updates by SMS/WhatsApp/email, gift wrapping and a personal
 * message, the membership plans, and a year of bloom with no water (data/faq.ts and the care
 * guide). The founding date and city the previous draft carried are gone — it said New York,
 * which nothing else on the site supports.
 *
 * The design is the storefront's existing vocabulary rather than a new one: serif headings, the
 * `text-secondary` eyebrow in uppercase tracking, muted body copy, hairline dividers, cream
 * panels, and local art from /public/images instead of stock photography.
 */
export default function AboutPage() {
  const PROCESS_STEPS = [
    {
      num: '01',
      title: 'Selection',
      desc: 'Stems are hand-picked at their peak of bloom and graded one by one, and only the heads that open evenly are kept. Each listing names the country its flowers came from.',
    },
    {
      num: '02',
      title: 'Preservation',
      desc: 'The natural sap is drawn out and replaced with a biodegradable glycerin blend, so the petal keeps the softness and the structure it had on the day it was cut.',
    },
    {
      num: '03',
      title: 'Colour',
      desc: 'Pigment goes in with the preserving solution rather than being sprayed on afterwards, which is why the shade sits inside the petal and does not rub off.',
    },
    {
      num: '04',
      title: 'Arrangement',
      desc: 'Our florists set every rose by hand in its box, working to the shape of the arrangement ordered, then check it once more before it is closed.',
    },
  ];

  const PROMISES = [
    {
      icon: Truck,
      title: 'Delivered across Qatar',
      desc: 'We deliver nationwide, subject to service availability, with same-day delivery on eligible locations ordered before the daily cut-off.',
    },
    {
      icon: CalendarClock,
      title: 'Timed to the moment',
      desc: 'Choose the delivery date and time at checkout, and follow the order by SMS, WhatsApp or email until it is handed over.',
    },
    {
      icon: MessageSquareHeart,
      title: 'Said in your words',
      desc: 'Add a personalised message to any order, and gift wrapping when it should arrive ready to give.',
    },
    {
      icon: BadgeCheck,
      title: 'Worth coming back to',
      desc: 'Our membership plans carry reward points and member benefits for the people who send flowers more than once.',
    },
  ];

  const WORK = [
    {
      href: '/shop',
      image: '/images/explore_eternity_flowers_1782905757139.png',
      label: 'The Collection',
      desc: 'Signature boxes of preserved roses, arranged and ready to send.',
    },
    {
      href: '/custom',
      image: '/images/category_bouquets_1782290106325.png',
      label: 'Made to Order',
      desc: 'Tell us the colours, the size and the occasion, and we build it for you.',
    },
    {
      href: '/collections',
      image: '/images/category_gift_boxes_1782290153364.png',
      label: 'Gifting',
      desc: 'Flowers paired with chocolate and keepsakes, for the days that matter.',
    },
  ];

  return (
    <div className="font-sans text-primary bg-white">
      {/* Hero */}
      <section className="relative w-full h-[420px] md:h-[520px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/about_florist_1782290182382.png"
          alt="A Lebami florist arranging preserved roses"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* Heavier than a typical scrim: the florist shot is bright and busy, and the
            headline has to stay readable across all of it. */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center text-white px-6">
          <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#C1A87D] font-semibold mb-3 block">
            Our Story
          </span>
          {/*
            The colour is inline, not a utility class. globals.css paints every h1-h6 with
            `:is(h1,...):not([data-bb-page] *) { color: var(--color-primary) }`, and that
            selector outranks `text-white` - so over this photograph the heading rendered
            maroon on red. An inline declaration is the one thing that beats it without
            touching a global rule every other page depends on.
          */}
          <h1
            className="font-serif text-4xl md:text-6xl font-medium tracking-wide drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Flowers that stay
          </h1>
          <p className="text-xs md:text-sm text-white/90 max-w-md mx-auto mt-4 leading-relaxed">
            Lebami began with one stubborn question: why should something this beautiful only
            last a week?
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <Breadcrumbs items={[{ label: 'Our Story', href: '/about' }]} />

        {/* Narrative */}
        <section className="py-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-[0.25em] text-secondary font-semibold block">
              Our Story
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-wide text-primary leading-tight">
              Flowers that carry your feelings
            </h2>
            <p className="text-muted text-sm md:text-base leading-relaxed">
              In Qatar, every beautiful moment is worth celebrating. A warm welcome for a guest, a family gathering, a special occasion, a new beginning, or simply saying &quot;I&apos;m thinking of you&quot; — these moments are often expressed not only through words, but through thoughtful gestures.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              Since 2019, LEBAMI has been part of those moments through the timeless beauty of flowers. We believe a flower is more than something beautiful. It carries a feeling — love, respect, gratitude, happiness, remembrance, and care. Inspired by Qatar&apos;s culture of generosity and hospitality, we carefully select premium flowers and create elegant arrangements that help people express what words sometimes cannot.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              From a single flower to a beautiful arrangement, every LEBAMI creation is prepared with care and delivered with one purpose: to turn a simple moment into a memorable emotion.
            </p>
            <Link
              href="/care"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-secondary hover:text-secondary-hover transition-colors"
            >
              How to care for them
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="relative aspect-[4/3] bg-cream border border-divider/40 shadow-md overflow-hidden">
            <Image
              src="/images/lillies.png"
              alt="Preserved lilies in a Lebami arrangement"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </section>

        {/* Craft */}
        <section className="py-20 border-y border-divider my-12">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light block mb-2">
              In the Atelier
            </span>
            <h2 className="font-serif text-3xl font-medium tracking-wide">How each box is made</h2>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Four stages between the farm and the ribbon, none of which can be rushed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.num}
                className="bg-cream/40 border border-divider p-8 relative flex flex-col justify-between"
              >
                <span className="font-serif text-4xl font-bold text-secondary/30 block mb-6">
                  {step.num}
                </span>
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

        {/* What we make */}
        <section className="py-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light block mb-2">
              What We Make
            </span>
            <h2 className="font-serif text-3xl font-medium tracking-wide">Three ways to send one</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WORK.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group block border border-divider/60 overflow-hidden bg-white hover:border-secondary/40 transition-colors"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="font-serif text-lg font-medium tracking-wide text-primary">
                    {item.label}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary pt-1">
                    Explore
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* The promise */}
        <section className="py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-square md:aspect-[4/3] bg-cream overflow-hidden border border-divider/40 shadow-sm order-last lg:order-first">
            <Image
              src="/images/explore_stores_1782905783786.png"
              alt="A Lebami arrangement prepared for delivery"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="space-y-6 lg:pl-6">
            <span className="text-xs uppercase tracking-[0.25em] text-secondary font-semibold block">
              Getting It There
            </span>
            <h2 className="font-serif text-3xl font-medium tracking-wide">
              The part that happens after checkout
            </h2>
            <p className="text-muted text-xs md:text-sm leading-relaxed">
              Much of what makes a gift land well has nothing to do with the flowers. It is whether
              it arrives on the right day, says the right thing, and reaches the person it was
              meant for.
            </p>

            <div className="space-y-4 pt-2">
              {PROMISES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start space-x-3">
                  <Icon size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-primary">
                      {title}
                    </h4>
                    <p className="text-[11px] text-muted leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kept simple */}
        <section className="py-12">
          <div className="bg-cream/50 border border-divider p-10 md:p-14 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex items-start space-x-3">
              <Leaf size={18} className="text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-primary mb-1.5">
                  Less thrown away
                </h4>
                <p className="text-[11px] text-muted leading-relaxed">
                  One preserved arrangement stands in for a year of bouquets bought, flown in and
                  binned a week later.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Sparkles size={18} className="text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-primary mb-1.5">
                  No upkeep
                </h4>
                <p className="text-[11px] text-muted leading-relaxed">
                  No water, no feeding, no trimming. Keep them out of direct sun and they hold for
                  a year.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Gift size={18} className="text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-primary mb-1.5">
                  Ready to give
                </h4>
                <p className="text-[11px] text-muted leading-relaxed">
                  Every arrangement leaves us boxed and finished, so nothing has to be assembled at
                  the other end.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section className="py-16 border-t border-divider">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-wide text-primary">
              Our Commitment
            </h2>
            <p className="text-muted text-sm md:text-base leading-relaxed">
              As we continue our journey, we remain committed to bringing premium flowers, thoughtful designs, and heartfelt experiences to homes, families, businesses, and celebrations across Qatar.
            </p>
            <div className="pt-6 border-t border-divider">
              <p className="font-serif text-xl md:text-2xl font-medium tracking-wide text-secondary italic">
                &quot;Flowers that carry your feelings&quot;
              </p>
            </div>
          </div>
        </section>

        {/* Onward */}
        <section className="py-16 text-center border-t border-divider">
          <h2 className="font-serif text-3xl font-medium tracking-wide mb-3">Come and see them</h2>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed mb-8">
            Browse the collection, or ask us anything — the common questions are answered in one
            place, and the rest by message.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-secondary hover:bg-secondary-hover text-white text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
            >
              Shop the Collection
            </Link>
            <Link
              href="/faq"
              className="w-full sm:w-auto px-8 py-3.5 border border-divider hover:border-primary text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
            >
              Read the FAQs
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-3.5 border border-divider hover:border-primary text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
