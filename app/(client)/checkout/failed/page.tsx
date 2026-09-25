import Link from 'next/link';
import { Clock, RotateCcw, ShoppingBag, XCircle } from 'lucide-react';
import { privatePageMetadata } from '@/lib/page-metadata';

export const metadata = privatePageMetadata('Payment Failed');

/**
 * Where a card payment lands when it did NOT succeed.
 *
 * Until now an unsuccessful return dropped the customer back on /checkout with a toast, which
 * disappeared after a few seconds and left them staring at the form with no explanation. This is
 * the order-side twin of /membership/failed, and it says the two things a customer actually
 * needs at that moment: nothing was charged, and their cart is still there.
 *
 * Two states, because the gateway distinguishes them and they mean different things:
 *   failed/cancelled — the attempt is over; retrying is the right move.
 *   pending          — SkipCash has not settled it yet; paying again could pay twice, so the
 *                      page says to wait for the confirmation instead of offering a retry.
 *
 * Nothing here decides anything about the money: the status is worked out server-side in
 * /api/payments/skipcash/return before the customer is ever sent here.
 */
export default async function CheckoutFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; state?: string }>;
}) {
  const { order, state } = await searchParams;
  const pending = state === 'pending';
  // The same short reference the confirmation screen shows, so the two match in an email.
  const reference = order ? order.slice(0, 8).toUpperCase() : null;

  const Icon = pending ? Clock : XCircle;

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 pb-16 page-below-header text-center font-sans text-primary">
      <div
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
          pending ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
        }`}
      >
        <Icon size={56} className="stroke-[1.5]" />
      </div>

      <span
        className={`mt-6 block text-[10px] uppercase tracking-[0.25em] font-semibold ${
          pending ? 'text-amber-600' : 'text-red-500'
        }`}
      >
        {pending ? 'Awaiting Confirmation' : 'Payment Failed'}
      </span>

      <h1 className="mt-2 font-serif text-3xl md:text-4xl font-medium tracking-wide">
        {pending ? 'Your payment is still being confirmed' : 'Payment not completed'}
      </h1>

      <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-muted">
        {pending
          ? 'The bank has not finished confirming this payment. Do not pay again — we will email you the moment it settles, and your order appears in your account automatically.'
          : 'Nothing has been charged and your order was not placed. Your cart, your points and any coupon are exactly as you left them.'}
      </p>

      {reference && (
        <p className="mt-5 inline-block border border-divider bg-cream/40 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-muted">
          Reference <span className="font-semibold text-primary">{reference}</span>
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {!pending && (
          <Link
            href="/checkout"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-sm bg-primary px-7 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-secondary"
          >
            <RotateCcw size={14} />
            Try Payment Again
          </Link>
        )}
        <Link
          href={pending ? '/account' : '/shop'}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-sm border border-primary/30 px-7 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-primary transition-colors hover:border-primary hover:bg-primary/[0.04]"
        >
          {pending ? 'View My Orders' : (<><ShoppingBag size={14} />Continue Shopping</>)}
        </Link>
      </div>

      <p className="mt-8 text-[11px] leading-relaxed text-muted">
        Something not right?{' '}
        <Link href="/contact" className="text-secondary underline underline-offset-2 hover:text-secondary-hover">
          Contact us
        </Link>{' '}
        and quote {reference ? `reference ${reference}` : 'this attempt'}.
      </p>
    </div>
  );
}
