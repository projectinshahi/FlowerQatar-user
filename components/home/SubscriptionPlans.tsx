import Link from 'next/link';
import { Clock } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import type { StoreSubscriptionPlan } from '@/lib/subscription-plans';
import { formatNumber } from '@/lib/utils';

/**
 * "Subscription Plans" — the three fixed tiers (Silver / Gold / Platinum) on the storefront.
 *
 * Server Component: static content, zero client JS (only the AnimatedSection scroll-reveal
 * wrapper is client, with the cards as its server children). Data arrives as props from the
 * home page — no client fetch, no loading state, no CLS. Hover lift/shadow are pure CSS.
 *
 * Each card shows the plan's single feature-points number prominently, its validity, and
 * how many products it applies to. The tier accent (Silver/Gold/Platinum) is a fixed
 * per-card color — the global palette is untouched. Renders nothing if plans didn't load.
 *
 * Responsive: 1 col mobile → 2 tablet → 3 desktop, equal card heights.
 */
export default function SubscriptionPlans({ plans }: { plans: StoreSubscriptionPlan[] }) {
  if (!plans || plans.length === 0) return null;

  return (
    <AnimatedSection className="py-16 md:py-24">
      <section id="membership" aria-label="Subscription plans" className="mx-auto w-full max-w-[1440px] px-6 md:px-12">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-[36px] font-light leading-[1.2] text-primary md:text-[48px]">
            Membership Plans
          </h2>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.2em] text-muted">Choose the plan that suits you</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              style={{ ['--accent' as string]: plan.accent }}
              className="group relative flex h-full flex-col overflow-hidden rounded-sm border border-divider/50 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl focus-within:-translate-y-1.5 focus-within:shadow-xl"
            >
              {/* Tier accent bar */}
              <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: plan.accent }} aria-hidden="true" />

              <h3 className="font-serif text-[26px] font-light leading-snug md:text-[28px]" style={{ color: plan.accent }}>
                {plan.name}
              </h3>

              {/* Price */}
              <p className="mt-2 font-serif text-[24px] font-light text-primary">
                <span className="align-top text-[13px] tracking-wide text-muted">QAR </span>
                {formatNumber(plan.price, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>

              {/* The single feature-points number — the hero of the card */}
              <div className="mt-6 flex-1">
                <p className="font-serif text-[52px] font-light leading-none text-primary md:text-[60px]">
                  {formatNumber(plan.featurePoints)}
                </p>
                <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.2em] text-muted">Feature Points</p>
              </div>

              {/* Validity + applicable products */}
              <div className="mt-8 space-y-3 border-t border-divider/40 pt-5">
                <div className="flex items-center gap-2">
                  <Clock size={15} style={{ color: plan.accent }} aria-hidden="true" />
                  <span className="font-sans text-[13px] text-primary/80">
                    Valid for <span className="font-medium text-primary">{plan.validityLabel || '—'}</span>
                  </span>
                </div>
              </div>

              {/* Subscribe → review + simulated payment */}
              <Link
                href={`/membership/checkout?plan=${plan.id}`}
                aria-label={`Subscribe to the ${plan.name} plan`}
                className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-sm px-6 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: plan.accent }}
              >
                Subscribe
              </Link>
            </article>
          ))}
        </div>
      </section>
    </AnimatedSection>
  );
}
