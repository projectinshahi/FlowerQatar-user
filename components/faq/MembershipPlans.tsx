'use client';

import { motion } from 'framer-motion';
import { Crown, Sparkles, Star } from 'lucide-react';
import { MEMBERSHIP_PLANS } from '@/data/faq';
import type { MembershipPlan } from '@/types/faq';

const ICONS = { Basic: Sparkles, Premium: Star, VIP: Crown } as const;

/** #RRGGBB → rgba() for soft tints. */
function tint(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(97,0,11,${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function PlanCard({ plan, onLearnMore }: { plan: MembershipPlan; onLearnMore: () => void }) {
  const Icon = ICONS[plan.name];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{ ['--accent' as string]: plan.accent }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white/70 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-24px_rgba(97,0,11,0.28)] ${
        plan.featured ? 'border-[var(--accent)]/50 shadow-[0_16px_40px_-22px_rgba(97,0,11,0.24)]' : 'border-divider/70 shadow-sm'
      }`}
    >
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl" style={{ background: tint(plan.accent, 0.18) }} />

      <div className="relative flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: tint(plan.accent, 0.12), color: plan.accent }}>
          <Icon size={20} />
        </span>
        {plan.featured && (
          <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: plan.accent }}>
            Popular
          </span>
        )}
      </div>

      <h3 className="relative mt-5 font-serif text-[24px] font-light" style={{ color: plan.accent }}>{plan.name}</h3>

      {plan.price ? (
        <p className="relative mt-1 font-serif text-[22px] font-light text-primary">
          <span className="align-top text-[12px] tracking-wide text-muted">QAR </span>
          {plan.price}
        </p>
      ) : (
        <p className="relative mt-1 font-sans text-[12px] uppercase tracking-[0.15em] text-muted">Membership tier</p>
      )}

      <ul className="relative mt-5 flex-1 space-y-2.5">
        <li className="flex items-start gap-2 font-sans text-[13px] text-primary/80">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: plan.accent }} />
          {plan.points}
        </li>
        <li className="flex items-start gap-2 font-sans text-[13px] text-primary/80">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: plan.accent }} />
          Valid for {plan.validity}
        </li>
      </ul>

      <button
        type="button"
        onClick={onLearnMore}
        className="relative mt-6 w-full rounded-full border border-primary/25 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.15em] text-primary transition-all duration-300 hover:border-primary/45 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        Learn More
      </button>
    </motion.div>
  );
}

/** Luxury 3-tier membership showcase shown above the Subscription Membership questions. */
export default function MembershipPlans({ onLearnMore }: { onLearnMore: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {MEMBERSHIP_PLANS.map((plan) => (
        <PlanCard key={plan.name} plan={plan} onLearnMore={onLearnMore} />
      ))}
    </div>
  );
}
