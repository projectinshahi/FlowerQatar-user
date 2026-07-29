'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X, ChevronRight, Check } from 'lucide-react';

interface Props {
  /** The order amount points can offset (subtotal + shipping + tax − coupon). 1 pt = 1 QAR. */
  maxRedeemable: number;
  /** Reports the confirmed redeem amount (server re-validates & deducts on order placement). */
  onChange?: (points: number) => void;
}

/**
 * Checkout redemption box. Members enter points, click Redeem, and confirm in a popup that
 * shows the discount (1 point = 1 QAR) and their remaining balance. The chosen amount is
 * reported to the parent and committed atomically server-side at order placement.
 * Non-members see a prompt to subscribe (points are earned via membership).
 */
export default function RedeemPointsBox({ maxRedeemable, onChange }: Props) {
  const [available, setAvailable] = useState<number | null>(null); // null = loading
  const [hasMembership, setHasMembership] = useState(false);
  const [input, setInput] = useState(0); // current input value
  const [applied, setApplied] = useState(0); // confirmed redemption
  const [showConfirm, setShowConfirm] = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/membership');
        const data = await res.json();
        if (cancelled) return;
        setHasMembership(!!data?.data?.membership);
        setAvailable(data?.data?.wallet?.availablePoints ?? 0);
      } catch {
        if (!cancelled) {
          setHasMembership(false);
          setAvailable(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Points can never exceed the wallet balance or the order value.
  const cap = Math.max(0, Math.min(available ?? 0, Math.floor(maxRedeemable)));

  // Re-clamp if the cap shrinks (e.g. a coupon lowers the order total).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInput((v) => Math.min(v, cap));
    setApplied((a) => {
      const clamped = Math.min(a, cap);
      if (clamped !== a) onChangeRef.current?.(clamped);
      return clamped;
    });
  }, [cap]);

  const setInputClamped = (raw: number) => setInput(Math.max(0, Math.min(Math.floor(raw || 0), cap)));

  const confirmRedeem = () => {
    setApplied(input);
    onChangeRef.current?.(input);
    setShowConfirm(false);
  };
  const removeRedeem = () => {
    setApplied(0);
    setInput(0);
    onChangeRef.current?.(0);
  };

  const canRedeem = hasMembership && (available ?? 0) > 0;
  const balanceAfter = (available ?? 0) - input;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-secondary" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Membership Points</span>
        </div>
        {canRedeem && (
          <span className="text-[11px] font-medium text-primary">{available!.toLocaleString()} available</span>
        )}
      </div>

      {available === null ? (
        <div className="h-10 animate-pulse rounded-lg bg-cream/50" />
      ) : !canRedeem ? (
        /* No active membership / no points → invite to subscribe */
        <Link
          href="/#membership"
          className="flex items-center justify-between gap-2 rounded-lg border border-divider bg-cream/30 px-3 py-2.5 text-[11px] text-muted transition-colors hover:border-secondary hover:text-primary"
        >
          <span>
            {hasMembership
              ? 'No points to redeem yet.'
              : 'Subscribe to a membership to earn points you can redeem here.'}
          </span>
          <span className="inline-flex items-center gap-0.5 font-semibold uppercase tracking-wider text-secondary">
            {hasMembership ? 'Plans' : 'Subscribe'} <ChevronRight size={13} />
          </span>
        </Link>
      ) : applied > 0 ? (
        /* Confirmed redemption */
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-[11px] font-medium text-green-700">
          <span className="inline-flex items-center gap-1.5">
            <Check size={13} /> {applied.toLocaleString()} pts redeemed
          </span>
          <span className="flex items-center gap-2">
            <span>−QAR {applied.toLocaleString()}</span>
            <span className="text-green-700/70">· {((available ?? 0) - applied).toLocaleString()} left</span>
            <button
              type="button"
              onClick={removeRedeem}
              aria-label="Remove redeemed points"
              className="inline-flex items-center text-muted transition-colors hover:text-red-600"
            >
              <X size={12} />
            </button>
          </span>
        </div>
      ) : (
        /* Input + Redeem */
        <>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={cap}
              value={input || ''}
              onChange={(e) => setInputClamped(Number(e.target.value))}
              placeholder="Points to redeem"
              aria-label="Points to redeem"
              className="flex-1 rounded-lg border border-divider bg-cream/30 px-3 py-2.5 text-xs tracking-wider text-primary placeholder:text-muted/60 focus:border-secondary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setInputClamped(cap)}
              disabled={cap === 0}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-divider px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-primary transition-colors hover:border-secondary disabled:opacity-50"
            >
              Max
            </button>
            <button
              type="button"
              onClick={() => input > 0 && setShowConfirm(true)}
              disabled={input <= 0}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Redeem
            </button>
          </div>
          {maxRedeemable >= 1 && (available ?? 0) >= Math.floor(maxRedeemable) ? (
            <p className="flex items-center gap-1 text-[10px] font-medium text-secondary">
              <Sparkles size={11} /> You have enough points to pay for this entire order — no card needed.
            </p>
          ) : (
            <p className="text-[10px] text-muted/70">1 point = QAR 1. Redeem up to {cap.toLocaleString()} on this order.</p>
          )}
        </>
      )}

      {/* Confirmation popup */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm points redemption"
            className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Sparkles size={22} />
            </div>
            <h3 className="mt-4 font-serif text-xl font-medium text-primary">Confirm Redemption</h3>
            <p className="mt-1 text-xs text-muted">Points are applied as a discount (1 point = QAR 1).</p>

            <dl className="mt-5 space-y-2.5 rounded-lg border border-divider bg-cream/40 px-4 py-3 text-left text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Redeeming</dt>
                <dd className="font-semibold text-primary">{input.toLocaleString()} pts</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Discount</dt>
                <dd className="font-semibold text-green-700">− QAR {input.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-divider pt-2.5">
                <dt className="text-muted">Balance after</dt>
                <dd className="font-semibold text-primary">{balanceAfter.toLocaleString()} pts</dd>
              </div>
            </dl>

            {maxRedeemable >= 1 && input >= Math.floor(maxRedeemable) && (
              <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-[11px] font-medium text-green-700">
                This covers your full order — you won&apos;t need to pay by card.
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-divider px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted transition-colors hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRedeem}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-secondary"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
