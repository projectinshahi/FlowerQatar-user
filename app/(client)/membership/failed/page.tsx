import Link from 'next/link';
import type { Metadata } from 'next';
import { XCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Payment Failed' };

export default async function MembershipFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const retryHref = plan ? `/membership/checkout?plan=${plan}` : '/#membership';

  return (
    <div className="mx-auto w-full max-w-[520px] px-6 py-12 text-center font-sans text-primary md:py-20">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
        <XCircle size={56} className="stroke-[1.5]" />
      </div>

      <span className="mt-6 block text-[10px] uppercase tracking-[0.25em] text-red-500 font-semibold">Payment Failed</span>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl font-medium tracking-wide">Payment not completed</h1>
      <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-muted">
        No subscription was activated and no points were credited. Nothing has been charged — you can safely try again.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={retryHref}
          className="inline-flex min-h-[48px] items-center justify-center rounded-sm bg-primary px-7 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-secondary"
        >
          Retry Payment
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-primary/30 px-7 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-primary transition-colors hover:border-primary hover:bg-primary/[0.04]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
