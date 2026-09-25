import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { CheckCircle2, Sparkles, CalendarClock, Gift } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/admin-guard';
import { planName, planAccent } from '@/lib/subscription-plans';
import { formatValidity } from '@/lib/validations/subscription-plan';
import { getWalletView } from '@/lib/services/wallet';
import { formatNumber } from '@/lib/utils';

export const metadata: Metadata = { title: 'Subscription Activated', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default async function MembershipSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/');

  /*
   * Scoped to the authenticated user — never expose another user's membership — and to an
   * ACTIVE one: a membership whose payment has not been verified has activated nothing and
   * must not be presented as though it had.
   */
  const membership = m
    ? await prisma.membership.findFirst({
        where: { id: m, userId: user.id, status: 'ACTIVE' },
        include: { plan: true },
      })
    : null;
  if (!membership) redirect('/');

  const wallet = await getWalletView(user.id);
  const name = planName(membership.plan.planType);
  const accent = planAccent(membership.plan.planType);
  const validityLabel = formatValidity(
    membership.plan.validityYears,
    membership.plan.validityMonths,
    membership.plan.validityDays
  ) || '—';

  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <Sparkles size={16} />, label: 'Plan', value: `${name} Membership` },
    { icon: <CalendarClock size={16} />, label: 'Validity', value: validityLabel },
    { icon: <Gift size={16} />, label: 'Points credited', value: `${formatNumber(membership.pointsCredited)} pts` },
    { icon: <CalendarClock size={16} />, label: 'Starts', value: fmtDate(membership.startsAt) },
    { icon: <CalendarClock size={16} />, label: 'Expires', value: fmtDate(membership.expiresAt) },
  ];

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 py-12 text-center font-sans text-primary md:py-20">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}1A`, color: accent }}>
        <CheckCircle2 size={56} className="stroke-[1.5]" />
      </div>

      <span className="mt-6 block text-[10px] uppercase tracking-[0.25em] text-secondary font-semibold">Subscription Activated</span>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl font-medium tracking-wide">Congratulations!</h1>
      <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-muted">
        Your <span className="font-medium text-primary">{name}</span> membership is now active and your points have been credited.
      </p>

      {/* Details */}
      <dl className="mt-8 overflow-hidden rounded-sm border border-divider/60 bg-white text-left shadow-sm">
        <span className="block h-1 w-full" style={{ backgroundColor: accent }} aria-hidden="true" />
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 border-b border-divider/40 px-5 py-3.5 last:border-b-0">
            <dt className="flex items-center gap-2.5 text-[13px] text-muted">
              <span style={{ color: accent }} aria-hidden="true">{r.icon}</span>
              {r.label}
            </dt>
            <dd className="text-[14px] font-medium text-primary">{r.value}</dd>
          </div>
        ))}
      </dl>

      {/* Wallet balance highlight */}
      <div className="mt-4 rounded-sm border border-divider/60 bg-cream px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Current available points</p>
        <p className="mt-1 font-serif text-[36px] font-light leading-none text-primary">
          {formatNumber(wallet.availablePoints)}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/shop"
          className="inline-flex min-h-[48px] items-center justify-center rounded-sm bg-primary px-7 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-secondary"
        >
          Continue Shopping
        </Link>
        <Link
          href="/account/profile"
          className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-primary/30 px-7 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-primary transition-colors hover:border-primary hover:bg-primary/[0.04]"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
