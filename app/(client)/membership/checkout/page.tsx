import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { planName, planAccent } from '@/lib/subscription-plans';
import { formatValidity } from '@/lib/validations/subscription-plan';
import Breadcrumbs from '@/components/Breadcrumbs';
import MembershipPayment from '@/components/membership/MembershipPayment';

export const metadata: Metadata = { title: 'Membership Checkout' };
export const dynamic = 'force-dynamic';

export default async function MembershipCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planId } = await searchParams;
  if (!planId) notFound();

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) notFound();

  const name = planName(plan.planType);
  const accent = planAccent(plan.planType);
  const price = Number(plan.price);
  const validityLabel = formatValidity(plan.validityYears, plan.validityMonths, plan.validityDays) || '—';

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-10 font-sans text-primary md:py-16">
      <Breadcrumbs items={[{ label: 'Membership', href: '/#membership' }, { label: 'Checkout' }]} />

      <div className="mt-4 text-center">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#C1A87D] font-semibold">Lebami Membership</span>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl font-medium tracking-wide text-[#800000]">Review &amp; Pay</h1>
      </div>

      {/* Review card */}
      <div className="mt-8 overflow-hidden rounded-sm border border-divider/60 bg-white shadow-sm">
        <span className="block h-1 w-full" style={{ backgroundColor: accent }} aria-hidden="true" />
        <div className="p-6 md:p-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-[26px] font-light" style={{ color: accent }}>{name}</h2>
            <p className="font-serif text-[22px] font-light text-primary">
              <span className="align-top text-[12px] tracking-wide text-muted">QAR </span>
              {price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </p>
          </div>

          <dl className="mt-6 space-y-3 border-t border-divider/40 pt-5 text-[14px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Points credited</dt>
              <dd className="font-medium text-primary">{plan.featurePoints.toLocaleString()} pts</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Validity</dt>
              <dd className="font-medium text-primary">{validityLabel}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-divider/40 pt-3">
              <dt className="text-[15px] font-semibold text-primary">Total due</dt>
              <dd className="text-[15px] font-semibold text-primary">
                QAR {price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Simulated payment controls (client) */}
      <MembershipPayment planId={plan.id} planName={name} price={price} accent={accent} />

      <p className="mt-6 text-center text-[11px] text-muted">
        This is a simulated payment — no real card is charged.
      </p>
    </div>
  );
}
