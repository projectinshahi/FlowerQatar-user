'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/lib/utils';

/**
 * A collision-safe idempotency key. `crypto.randomUUID()` only exists in a secure context,
 * so it throws when the app is opened over a plain-HTTP LAN IP (e.g. http://192.168.x.x:PORT).
 * We use it when available and fall back to a random string everywhere else — so clicking
 * "Complete Payment" never throws.
 */
function makeIdempotencyKey(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  const rand = () => Math.random().toString(36).slice(2, 12);
  return `mem-${Date.now().toString(36)}-${rand()}-${rand()}`;
}

/**
 * Payment control for a membership purchase.
 *
 * It asks the server to start the purchase and then hands the customer over to SkipCash's
 * hosted card form. The amount is never sent from here — the server reads the plan's price —
 * and nothing about the outcome is decided here either: the membership is activated only when
 * the payment is verified with SkipCash (webhook or return URL). A stable idempotency key,
 * generated once per visit, makes a double-click safe. Guests are prompted to sign in (the API
 * enforces auth server-side regardless).
 */
export default function MembershipPayment({
  planId,
  planName,
  price,
  accent,
}: {
  planId: string;
  planName: string;
  price: number;
  accent: string;
}) {
  const router = useRouter();
  const { user, setAccountOpen, addToast } = useApp();
  const [processing, setProcessing] = useState(false);
  const keyRef = useRef('');

  const priceLabel = formatNumber(price, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const pay = async () => {
    if (processing) return; // one payment per click, however fast the second one arrives
    if (!user) {
      addToast('Please sign in to subscribe.', 'info');
      setAccountOpen(true);
      return;
    }
    if (!keyRef.current) keyRef.current = makeIdempotencyKey();

    setProcessing(true);
    try {
      const res = await fetch('/api/membership/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, idempotencyKey: keyRef.current }),
      });
      const data = await res.json();

      if (res.status === 401) {
        addToast('Please sign in to subscribe.', 'info');
        setAccountOpen(true);
        return;
      }

      // Hand over to the gateway. Kept spinning: the browser is leaving this page.
      if (res.ok && data?.payUrl) {
        window.location.href = data.payUrl;
        return;
      }

      // Nothing to pay (a free plan) — the server already settled it.
      if (res.ok && data?.paid && data.membershipId) {
        router.push(`/membership/success?m=${data.membershipId}`);
        return;
      }

      addToast(data?.error || 'Payment could not be started.', 'error');
      router.push(`/membership/failed?plan=${planId}`);
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
      router.push(`/membership/failed?plan=${planId}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mt-6 rounded-sm border border-divider/60 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-2 text-primary">
        <CreditCard size={16} aria-hidden="true" />
        <h2 className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em]">Payment</h2>
      </div>

      <button
        type="button"
        onClick={pay}
        disabled={processing}
        className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm px-6 py-3 font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ backgroundColor: accent }}
      >
        {processing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
        {processing ? 'Processing…' : `Complete Payment · QAR ${priceLabel}`}
      </button>

      <p className="mt-4 text-center text-[11px] text-muted">
        Subscribing to <span className="font-medium text-primary">{planName}</span> — points are credited once
        your payment is confirmed.
      </p>
    </div>
  );
}
