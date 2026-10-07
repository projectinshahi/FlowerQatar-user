"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Check, X, Truck, Tag } from "lucide-react";
import { formatMoney } from "@/components/admin/marketing/ui";

interface CartLine {
  productId: string;
  quantity: number;
  price: number;
}

interface AppliedResult {
  code: string;
  discount: number;
  freeDelivery: boolean;
}

interface CouponBoxProps {
  items: CartLine[];
  onApplied?: (r: AppliedResult | null) => void;
}

type ValidateResponse =
  | {
      valid: true;
      code: string;
      discount: number;
      freeDelivery: boolean;
      subtotal: number;
      updatedTotal: number;
      message: string;
    }
  | { valid: false; reason: string };

interface FreeDeliveryResponse {
  eligible: boolean;
  remaining: number;
  campaign?: { id: string; name: string; minOrderAmount: number };
}

export default function CouponBox({ items, onApplied }: CouponBoxProps) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedResult | null>(null);
  const [freeDelivery, setFreeDelivery] = useState<FreeDeliveryResponse | null>(null);

  // Keep the latest onApplied callback (and applied result) without forcing them into effect
  // deps. Updated in the first effect, so every later effect and handler sees the current value.
  const onAppliedRef = useRef(onApplied);
  const appliedRef = useRef<AppliedResult | null>(applied);
  useEffect(() => {
    onAppliedRef.current = onApplied;
    appliedRef.current = applied;
  });

  const hasItems = items.length > 0;
  const allHaveIds = hasItems && items.every((i) => !!i.productId);
  const canApply = hasItems && allHaveIds && code.trim().length > 0 && !pending;

  // Stable content signature so effects don't re-run on new array references.
  const itemsKey = JSON.stringify(items);

  // A cart change clears the error, and the free-delivery hint when the cart cannot be checked
  // (adjusted during render; the effects below keep the parts that call out).
  const [cartKey, setCartKey] = useState(itemsKey);
  if (cartKey !== itemsKey) {
    setCartKey(itemsKey);
    setError(null);
    if (!hasItems || !allHaveIds) setFreeDelivery(null);
  }

  // Any change to the cart invalidates a previously applied coupon.
  useEffect(() => {
    if (appliedRef.current) {
      setApplied(null);
      onAppliedRef.current?.(null);
    }
  }, [itemsKey]);

  // Free-delivery hint on mount and whenever the cart changes.
  useEffect(() => {
    if (!hasItems || !allHaveIds) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/free-delivery/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const data = (await res.json()) as FreeDeliveryResponse & { reason?: string };
        if (!cancelled) {
          setFreeDelivery(typeof data?.eligible === "boolean" ? data : null);
        }
      } catch {
        if (!cancelled) setFreeDelivery(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const handleApply = async () => {
    if (!canApply) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), items }),
      });
      const data = (await res.json()) as ValidateResponse;
      if (data.valid) {
        const result: AppliedResult = {
          code: data.code,
          discount: data.discount,
          freeDelivery: data.freeDelivery,
        };
        setApplied(result);
        setError(null);
        onAppliedRef.current?.(result);
      } else {
        setApplied(null);
        setError(data.reason || "This coupon could not be applied.");
        onAppliedRef.current?.(null);
      }
    } catch {
      setApplied(null);
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setCode("");
    setError(null);
    onAppliedRef.current?.(null);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Tag size={13} className="text-secondary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          Have a promo code?
        </span>
      </div>

      {/* Free delivery progress / unlocked (suppressed when a coupon already grants it) */}
      {freeDelivery && !applied?.freeDelivery && (
        freeDelivery.eligible ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[11px] font-medium text-green-700">
            <Truck size={14} />
            <span>You&apos;ve unlocked free delivery</span>
          </div>
        ) : freeDelivery.remaining > 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-divider bg-cream/40 px-3 py-2 text-[11px] text-muted">
            <Truck size={14} className="text-secondary" />
            <span>
              Add {formatMoney(freeDelivery.remaining)} more for free delivery
            </span>
          </div>
        ) : null
      )}

      {applied ? (
        /* Applied state */
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-green-600/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-green-700">
            <Check size={12} /> {applied.code}
          </span>
          <span className="text-[11px] font-medium text-green-700">
            You saved {formatMoney(applied.discount)}
          </span>
          {applied.freeDelivery && (
            <span className="inline-flex items-center gap-1 rounded-md bg-green-600/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-700">
              <Truck size={11} /> Free delivery
            </span>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-red-600"
          >
            <X size={12} /> Remove
          </button>
        </div>
      ) : (
        /* Input state */
        <div className="flex gap-2">
          <input aria-label="Promo code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply();
              }
            }}
            placeholder="PROMO CODE"
            disabled={pending}
            className="flex-1 rounded-lg border border-divider bg-cream/30 px-3 py-2.5 text-xs uppercase tracking-wider text-primary placeholder:text-muted/60 focus:border-secondary focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition-colors duration-300 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {pending ? "Applying" : "Apply"}
          </button>
        </div>
      )}

      {/* Invalid reason */}
      {error && !applied && (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
          <X size={13} className="flex-shrink-0" /> {error}
        </p>
      )}

      {/* Guard hint */}
      {!applied && (!hasItems || !allHaveIds) && (
        <p className="text-[10px] text-muted/70">
          {!hasItems
            ? "Add items to your cart to use a coupon."
            : "Coupons are unavailable for the items in your cart."}
        </p>
      )}
    </div>
  );
}
