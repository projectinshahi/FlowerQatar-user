'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import Link from 'next/link';
import { ChevronRight, ChevronUp, ChevronDown, CreditCard, ShieldCheck, CheckCircle2, Check, MapPin } from 'lucide-react';
import Image from '../../../components/LuxuryImage';
import CouponBox from '../../../components/checkout/CouponBox';
import RedeemPointsBox from '../../../components/checkout/RedeemPointsBox';
import {
  NO_SHIPPING,
  calculateShippingForMethod,
  type ShippingConfig,
} from '../../../lib/shipping';
import { qar, formatNumber } from '../../../lib/utils';
import { cartView } from '../../../lib/cart-limits';
import { onLive, onResync } from '../../../lib/live-client';
import { ZONE_PATTERN, formatQatarAddress, formatShippingAddress, isValidQatarMobile, normalizeQatarMobile, qatarLocalDigits } from '../../../lib/qatar';
import { useAddresses } from '../../../hooks/useAddresses';
import Flag from '../../../components/account/address/Flag';
import LabelGlyph from '../../../components/account/address/LabelGlyph';
import DefaultBadge from '../../../components/account/address/DefaultBadge';

type AddressKey = 'zone' | 'street' | 'building' | 'unit';

/** Qatar national address, worded exactly as the saved-address form (AddressForm). */
const ADDRESS_FIELDS: { key: AddressKey; label: string; placeholder: string; required: boolean; maxLength: number }[] = [
  { key: 'zone', label: 'Zone *', placeholder: 'e.g. 66', required: true, maxLength: 3 },
  { key: 'street', label: 'Street *', placeholder: 'e.g. 920', required: true, maxLength: 100 },
  { key: 'building', label: 'Building *', placeholder: 'e.g. 12', required: true, maxLength: 50 },
  { key: 'unit', label: 'Unit', placeholder: 'Apartment / villa no.', required: false, maxLength: 30 },
];

/** Radios in the brand colour rather than the browser's blue. */
const BRAND_CONTROL = { accentColor: 'var(--color-primary)' };

/** "+974 5512 3456" from the 8 local digits. */
const formatLocalMobile = (digits: string) => `+974 ${digits.slice(0, 4)} ${digits.slice(4)}`;

/** A Qatari mobile field: +974 fixed in the box, the 8 local digits typed, a tick when valid. */
function QatarPhoneField({ id, label, value, error, autoComplete, onChange }: {
  id: string;
  label: string;
  value: string;
  error?: string;
  autoComplete: string;
  onChange: (digits: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
        {label}
      </label>
      <div className="relative">
        {/* Fixed country code, drawn inside the field's own border so the global input focus
            ring still frames the whole thing. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-1.5 border-r border-divider pl-4 pr-3 text-xs text-primary select-none"
        >
          <Flag code="QA" />
          +974
        </span>
        <input
          type="tel"
          required
          value={value}
          id={id}
          aria-label={`${label}, Qatar (+974)`}
          autoComplete={autoComplete}
          inputMode="numeric"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          // Digits only, at most 8; a pasted "+974 5512 3456" keeps just the local part.
          onChange={(e) => onChange(qatarLocalDigits(e.target.value))}
          className="w-full pr-10 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
          // Clears the +974 segment; inline so it never depends on a newly generated class.
          style={{ paddingLeft: 96 }}
          placeholder=""
        />
        {isValidQatarMobile(value) && !error && (
          <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
        )}
      </div>
      {error && <p id={`${id}-err`} role="alert" className="text-red-500 text-[10px] mt-1 font-medium">{error}</p>}
    </div>
  );
}

interface FormErrors {
  [key: string]: string;
}

interface AppliedCoupon {
  code: string;
  discount: number;
  freeDelivery: boolean;
}

export default function CheckoutPage() {
  const { cart, cartLoading, getCartTotal, refreshCart, user, addToast } = useApp();
  const [step, setStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  // Generated once when the order is placed, so the reference stays stable across re-renders.
  const [orderRef, setOrderRef] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  /** Filled when the order is settled: the figures come from the order, not from the cart. */
  const [paidOrder, setPaidOrder] = useState<{ amount: number; points: number } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  // Membership points redeemed at checkout (1 point = 1 QAR). Committed server-side on placement.
  const [pointsRedeemed, setPointsRedeemed] = useState(0);

  // Form Fields State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addr, setAddr] = useState<Record<AddressKey, string>>({ zone: '', street: '', building: '', unit: '' });
  // Sender (the customer) and receiver (who the flowers go to): the 8 local digits each; +974 is
  // fixed in the fields and added when the order is sent.
  const [phone, setPhone] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'courier'>('standard');


  const [errors, setErrors] = useState<FormErrors>({});

  /*
   * Delivery address: one of the shopper's saved addresses, or "Other" — an address typed here
   * for this order only, never written to their address book.
   *
   * Only saved addresses in the Qatar format can be delivered to; ones saved before zone /
   * street / building existed are shown but disabled. Until the shopper picks, the choice
   * follows their default (or first usable) address, and falls back to "Other" when there is none.
   * ('new' is the id of the Other option.)
   */
  const { addresses, loading: addressesLoading } = useAddresses();
  const deliverable = addresses.filter((a) => a.zone && a.street && a.building);
  const [picked, setPicked] = useState<string | null>(null);
  const selectedId =
    picked && (picked === 'new' || deliverable.some((a) => a.id === picked))
      ? picked
      : (deliverable.find((a) => a.isDefault) ?? deliverable[0])?.id ?? 'new';
  const selectedSaved = deliverable.find((a) => a.id === selectedId) ?? null;
  const deliveryAddr: Record<AddressKey, string> = selectedSaved
    ? { zone: selectedSaved.zone, street: selectedSaved.street, building: selectedSaved.building, unit: selectedSaved.unit ?? '' }
    : addr;
  // Saved addresses whose details panel is open (the chevron in the card's corner).
  const [openDetails, setOpenDetails] = useState<string[]>([]);
  const toggleDetails = (id: string) =>
    setOpenDetails((open) => (open.includes(id) ? open.filter((x) => x !== id) : [...open, id]));

  /*
   * Pre-fill from the signed-in user, never overwriting anything already typed.
   *
   * Adjusted DURING RENDER rather than in an effect. `user` arrives from the context after the
   * first paint, and an effect that sets five pieces of state for it renders the empty form,
   * commits it, then immediately renders again - the cascading render react-hooks flags, and a
   * visible flash of blank fields on a slow connection. React re-runs this component before
   * touching the DOM, so the filled fields are what actually paint.
   *
   * Guarded on the user's id, so it runs once per account rather than on every render, and runs
   * again if a different account signs in. The functional updates keep a visitor's own typing:
   * only an empty field takes the saved value.
   */
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setEmail((v) => v || user.email || '');
    setFirstName((v) => v || user.firstName || '');
    setLastName((v) => v || user.lastName || '');
    // Only a saved Qatari mobile pre-fills: anything else would be cut into wrong digits.
    setPhone((v) => v || normalizeQatarMobile(user.phone || '')?.slice(4) || '');
  }

  /*
   * Delivery rules come from the admin, not from constants here. Until they load, price at
   * NO_SHIPPING (free) rather than guessing a fee: showing a charge that then disappears is
   * worse than showing free and having a fee appear, and the server re-prices the order from
   * this same rule on placement, so the displayed figure can never be what is actually billed
   * if the two disagree.
   */
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(NO_SHIPPING);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/shipping')
        .then((r) => r.json())
        .then((json) => {
          if (alive && json?.success && json.data) setShippingConfig(json.data as ShippingConfig);
        })
        .catch(() => {
          // Leave NO_SHIPPING in place; placeOrder re-derives the real figure server-side.
        });
    load();
    // Re-read when an admin changes the delivery charge, or after missing that while offline.
    const offLive = onLive((event) => {
      if (event.type === 'delivery.updated') load();
    });
    const offResync = onResync(load);
    return () => {
      alive = false;
      offLive();
      offResync();
    };
  }, []);

  const subtotal = getCartTotal();
  const shippingFee = calculateShippingForMethod(subtotal, shippingConfig, shippingMethod);
  const standardFee = calculateShippingForMethod(subtotal, shippingConfig, 'standard');
  const courierFee = calculateShippingForMethod(subtotal, shippingConfig, 'courier');
  const money = (n: number) => (n <= 0 ? 'Complimentary' : `QAR ${n}`);

  // Coupon-derived adjustments (default to no-ops when no coupon is applied).
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const effectiveShipping = appliedCoupon?.freeDelivery ? 0 : shippingFee;
  // Order value before points; points can offset up to this amount.
  const total = Math.max(0, subtotal + effectiveShipping - couponDiscount);
  const pointsDiscount = Math.min(pointsRedeemed, total); // 1 point = 1 QAR
  const grandTotal = Math.max(0, total - pointsDiscount);

  // Map cart lines to the shape the coupon APIs expect, skipping items with no product id.
  const couponItems = cart
    .map((item) =>
      'id' in item.product && item.product.id
        ? { productId: item.product.id, quantity: item.quantity, price: item.price }
        : null
    )
    .filter((x): x is { productId: string; quantity: number; price: number } => x !== null);

  const validateStep = () => {
    const tempErrors: FormErrors = {};

    if (step === 1) {
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        tempErrors.email = 'Enter a valid email address';
      }
      if (!firstName.trim()) tempErrors.firstName = 'First name is required';
      if (!lastName.trim()) tempErrors.lastName = 'Last name is required';
      // A typed address follows the same rules as the saved-address form and the order API.
      if (selectedId === 'new') {
        if (!ZONE_PATTERN.test(addr.zone.trim())) tempErrors.zone = 'Enter your zone number (e.g. 66)';
        if (!addr.street.trim()) tempErrors.street = 'Street is required';
        if (!addr.building.trim()) tempErrors.building = 'Building is required';
      }
      if (!isValidQatarMobile(phone)) {
        tempErrors.phone = "Enter the sender's Qatar mobile number: 8 digits starting with 3, 5, 6 or 7";
      }
      if (!isValidQatarMobile(receiverPhone)) {
        tempErrors.receiverPhone = "Enter the receiver's Qatar mobile number: 8 digits starting with 3, 5, 6 or 7";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  /*
   * Coming back from the payment gateway. The order was created before the customer left, so
   * the form state behind this screen is gone — the confirmation is rebuilt from the order.
   * The payment itself was verified server-side; the query string is only a hint about where
   * to land, never proof that anything was paid.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderId = params.get('order');
    if (!payment) return;
    // Drop the parameters so a refresh of this page does not replay the landing.
    window.history.replaceState(null, '', '/checkout');

    if (payment !== 'success' || !orderId) {
      addToast(
        payment === 'pending'
          ? 'We are still waiting for your payment to be confirmed. Your cart is unchanged.'
          : 'Your payment was not completed. Your cart is unchanged — you can try again.',
        'error'
      );
      return;
    }

    (async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) return;
      const info = (data.order.shippingInfo ?? {}) as Record<string, string>;
      setEmail(info.email ?? '');
      // The confirmation shows the address the ORDER was placed with, not today's default.
      setAddr({ zone: info.zone ?? '', street: info.street ?? '', building: info.building ?? '', unit: info.unit ?? '' });
      setPicked('new');
      if (info.shippingMethod === 'courier') setShippingMethod('courier');
      setPaidOrder({ amount: Number(data.order.totalAmount), points: data.order.pointsRedeemed ?? 0 });
      setCreatedOrderId(orderId);
      setOrderRef(orderId.slice(0, 8).toUpperCase());
      setOrderPlaced(true);
      // The server already removed exactly the lines that were paid for.
      refreshCart();
    })();
    // Runs once, on landing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaceOrder = async () => {
    if (placing) return;
    setPlacing(true);
    // Set when the browser is on its way to the gateway: the button must stay disabled.
    let handedOff = false;
    try {
      // Create the order on the server: it re-derives the totals from the authoritative cart
      // and records the Order (+ items) as UNPAID. Nothing is spent until the payment is
      // verified — the cart, the points and the coupon are all left alone for now.
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingMethod,
          couponCode: appliedCoupon?.code ?? null,
          pointsRedeemed,
          shippingInfo: { firstName, lastName, email, phone: `+974${phone}`, receiverPhone: `+974${receiverPhone}`, ...deliveryAddr },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        addToast(data?.error || 'Could not place your order. Please try again.', 'error');
        setPlacing(false);
        return;
      }
      setCreatedOrderId(data.orderId || data.id || null);
      setOrderRef(data.reference || data.orderId);

      // Card payment: hand the customer over to the SkipCash hosted page.
      if (data.payUrl) {
        handedOff = true;
        window.location.href = data.payUrl;
        return;
      }

      // Nothing was payable (points/discount covered it): the order is already settled.
      setPaidOrder({ amount: data.totalAmount ?? 0, points: data.pointsRedeemed ?? 0 });
      setOrderPlaced(true);
      refreshCart();
    } catch {
      addToast('Something went wrong placing your order. Please try again.', 'error');
    } finally {
      if (!handedOff) setPlacing(false);
    }
  };

  if (orderPlaced) {
    const invoiceTargetId = createdOrderId || orderRef;
    return (
      <div className="max-w-xl mx-auto px-6 pb-20 page-below-header text-center font-sans text-primary space-y-6">
        <div className="flex justify-center text-secondary">
          <CheckCircle2 size={64} className="stroke-[1.5]" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.25em] text-secondary font-semibold block">
          Payment Confirmed
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-wide">
          Thank you for your Order
        </h1>
        <p className="text-muted text-xs md:text-sm leading-relaxed max-w-sm mx-auto">
          Your payment was processed successfully. A confirmation email with invoice and tracking details has been sent to <span className="font-medium text-primary">{email}</span>.
        </p>
        <div className="bg-cream border border-divider p-6 text-left space-y-2 text-xs text-muted rounded-none">
          <p><span className="font-semibold text-primary">Order Reference:</span> #{orderRef}</p>
          <p><span className="font-semibold text-primary">Amount Paid:</span> QAR {paidOrder?.amount ?? grandTotal}</p>
          {(paidOrder?.points ?? pointsDiscount) > 0 && (
            <p><span className="font-semibold text-primary">Points Redeemed:</span> {formatNumber(paidOrder?.points ?? pointsDiscount)} pts (−QAR {paidOrder?.points ?? pointsDiscount})</p>
          )}
          <p><span className="font-semibold text-primary">Shipping Address:</span> {formatShippingAddress(deliveryAddr)}, Qatar</p>
          <p><span className="font-semibold text-primary">Estimated Arrival:</span> {shippingMethod === 'courier' ? 'Tomorrow by 6:00 PM' : '3-5 Business Days'}</p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {invoiceTargetId && (
            <Link
              href={`/orders/${invoiceTargetId}/invoice`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#61000B] hover:bg-[#800010] text-white text-xs uppercase tracking-[0.2em] font-medium py-3.5 px-7 transition-colors rounded-none shadow-md"
            >
              <span>View Tax Invoice</span>
              <span className="font-arabic font-normal text-[11px] ml-1">(فاتورة ضريبية)</span>
            </Link>
          )}
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-block border border-primary text-primary hover:bg-primary hover:text-white text-xs uppercase tracking-[0.2em] font-medium py-3.5 px-7 transition-colors rounded-none"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const view = cartView(cart.length, cartLoading);
  if (view === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-6 pb-24 page-below-header grid grid-cols-1 lg:grid-cols-12 gap-12" aria-busy="true" aria-label="Loading your cart">
        <div className="lg:col-span-7 space-y-4">
          <div className="h-4 w-1/3 skeleton" />
          <div className="h-48 skeleton" />
        </div>
        <div className="lg:col-span-5 h-64 skeleton" />
      </div>
    );
  }

  if (view === 'empty') {
    return (
      <div className="max-w-7xl mx-auto px-6 pb-24 page-below-header text-center font-sans">
        <h2 className="font-serif text-2xl mb-4">Your Cart is empty</h2>
        <Link href="/shop" className="text-secondary underline uppercase tracking-widest text-xs">
          Return to Shop
        </Link>
      </div>
    );
  }

  /** Qatar national address fields — the same wording as the saved-address form (AddressForm). */
  const newAddressForm = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ADDRESS_FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`co-${f.key}`} className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
              {f.label}
            </label>
            <input
              type="text"
              required={f.required}
              value={addr[f.key]}
              id={`co-${f.key}`}
              inputMode={f.key === 'zone' ? 'numeric' : undefined}
              maxLength={f.maxLength}
              aria-invalid={!!errors[f.key] || undefined}
              aria-describedby={errors[f.key] ? `co-${f.key}-err` : undefined}
              onChange={(e) => setAddr((a) => ({ ...a, [f.key]: e.target.value }))}
              className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
              placeholder={f.placeholder}
            />
            {errors[f.key] && <p id={`co-${f.key}-err`} role="alert" className="text-red-500 text-[10px] mt-1 font-medium">{errors[f.key]}</p>}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted">
        You&apos;ll find these numbers on the blue plate outside your building. This address is used for this order only and is not saved to your addresses.
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pb-8 page-below-header font-sans text-primary">
      {/* Step Indicators */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted font-medium">
          <span className={step >= 1 ? 'text-secondary font-bold' : ''}>1. Shipping</span>
          <ChevronRight size={14} />
          <span className={step >= 2 ? 'text-secondary font-bold' : ''}>2. Delivery</span>
          <ChevronRight size={14} />
          <span className={step >= 3 ? 'text-secondary font-bold' : ''}>3. Payment</span>
          <ChevronRight size={14} />
          <span className={step >= 4 ? 'text-secondary font-bold' : ''}>4. Review</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Stepper Forms (Col: 7) */}
        <div className="lg:col-span-7">
          
          {/* STEP 1: Contact and Shipping Info */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-6">
              <h2 className="font-serif text-2xl text-primary border-b border-divider pb-3">
                1. Contact & Shipping Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    id="co-email" aria-label="Email address" autoComplete="email" inputMode="email" aria-invalid={!!errors.email || undefined} aria-describedby={errors.email ? "co-email-err" : undefined} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                    placeholder="e.g. customer@luxury.com"
                  />
                  {errors.email && <p id="co-email-err" role="alert" className="text-red-500 text-[10px] mt-1 font-medium">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      id="co-firstName" aria-label="First name" autoComplete="given-name" aria-invalid={!!errors.firstName || undefined} aria-describedby={errors.firstName ? "co-firstName-err" : undefined} onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                    />
                    {errors.firstName && <p id="co-firstName-err" role="alert" className="text-red-500 text-[10px] mt-1 font-medium">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      id="co-lastName" aria-label="Last name" autoComplete="family-name" aria-invalid={!!errors.lastName || undefined} aria-describedby={errors.lastName ? "co-lastName-err" : undefined} onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                    />
                    {errors.lastName && <p id="co-lastName-err" role="alert" className="text-red-500 text-[10px] mt-1 font-medium">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Sender (the customer) and receiver (who the flowers go to). A corrected number
                    drops its stale error straight away, so its tick shows immediately. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <QatarPhoneField
                    id="co-phone"
                    label="Sender Phone Number"
                    value={phone}
                    error={errors.phone}
                    autoComplete="tel-national"
                    onChange={(digits) => {
                      setPhone(digits);
                      if (errors.phone) setErrors((prev) => { const next = { ...prev }; delete next.phone; return next; });
                    }}
                  />
                  <QatarPhoneField
                    id="co-receiver-phone"
                    label="Receiver Phone Number"
                    value={receiverPhone}
                    error={errors.receiverPhone}
                    // Not the shopper's own number, so the browser should not autofill it.
                    autoComplete="off"
                    onChange={(digits) => {
                      setReceiverPhone(digits);
                      if (errors.receiverPhone) setErrors((prev) => { const next = { ...prev }; delete next.receiverPhone; return next; });
                    }}
                  />
                </div>

                {/* Delivery address: pick a saved one, or add a new one (Flipkart-style). */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted">Delivery Address</h3>
                  {addressesLoading ? (
                    <div className="space-y-3" aria-busy="true" aria-label="Loading your saved addresses">
                      <div className="h-16 skeleton" />
                      <div className="h-16 skeleton" />
                    </div>
                  ) : addresses.length === 0 ? (
                    newAddressForm
                  ) : (
                    <div role="radiogroup" aria-label="Delivery address" className="space-y-3">
                      {addresses.map((a) => {
                        const usable = deliverable.includes(a);
                        const active = selectedId === a.id;
                        const open = usable && openDetails.includes(a.id);
                        return (
                          <div
                            key={a.id}
                            className={`relative border transition-colors ${active ? 'border-primary bg-cream' : 'border-divider bg-white'} ${usable ? 'hover:border-primary' : 'opacity-60'}`}
                          >
                            <label className={`flex items-start gap-3 p-4 pr-14 ${usable ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                              <input type="radio" name="delivery-address" className="mt-0.5" style={BRAND_CONTROL} checked={active} disabled={!usable} onChange={() => setPicked(a.id)} />
                              <span className="flex-1 min-w-0 space-y-1.5">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-primary">
                                    <LabelGlyph label={a.label} size={12} /> {a.label}
                                  </span>
                                  {a.isDefault && <DefaultBadge />}
                                </span>
                                {!usable ? (
                                  <span className="block text-xs text-muted leading-relaxed">
                                    Saved before zone, street and building were required. Update it in My Addresses to deliver here.
                                  </span>
                                ) : (
                                  !open && <span className="block text-xs text-muted leading-relaxed">{formatQatarAddress(a)}, Qatar</span>
                                )}
                              </span>
                            </label>
                            {usable && (
                              // Outside the <label>, so opening the details never changes the selection.
                              <button
                                type="button"
                                onClick={() => toggleDetails(a.id)}
                                aria-expanded={open}
                                aria-controls={`addr-details-${a.id}`}
                                aria-label={`${open ? 'Hide' : 'Show'} ${a.label} address details`}
                                className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full border border-divider bg-white text-primary transition-colors hover:border-primary"
                              >
                                {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                              </button>
                            )}
                            {open && (
                              <dl id={`addr-details-${a.id}`} className="mx-4 mb-4 border-t border-divider pt-3 space-y-2 text-xs" style={{ marginLeft: 44 }}>
                                {([['Zone', a.zone], ['Street', a.street], ['Building', a.building], ['Unit', a.unit], ['Country', 'Qatar']] as const)
                                  .filter(([, value]) => value)
                                  .map(([name, value]) => (
                                    <div key={name} className="flex gap-4">
                                      <dt className="w-20 shrink-0 text-[10px] uppercase tracking-wider font-semibold text-muted">{name}</dt>
                                      <dd className="text-primary">{value}</dd>
                                    </div>
                                  ))}
                              </dl>
                            )}
                          </div>
                        );
                      })}
                      {/* Other: an address for this order only — it is not saved to the account. */}
                      <div className={`border transition-colors ${selectedId === 'new' ? 'border-primary bg-cream' : 'border-divider bg-white hover:border-primary'}`}>
                        <label className="flex items-start gap-3 p-4 cursor-pointer">
                          <input type="radio" name="delivery-address" className="mt-0.5" style={BRAND_CONTROL} checked={selectedId === 'new'} onChange={() => setPicked('new')} />
                          <span className="flex-1 min-w-0 space-y-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-primary">
                              <MapPin size={12} /> Other
                            </span>
                            <span className="block text-xs text-muted leading-relaxed">Deliver this order to a different address</span>
                          </span>
                        </label>
                        {selectedId === 'new' && <div className="px-4 pb-4">{newAddressForm}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary text-white uppercase text-xs tracking-widest font-semibold hover:bg-secondary transition-colors duration-500 rounded-none"
                >
                  Continue to Delivery
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Shipping Method Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl text-primary border-b border-divider pb-3">
                2. Shipping & Delivery Method
              </h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShippingMethod('standard')}
                  className={`w-full p-4 border text-left flex justify-between items-center transition-all rounded-none ${
                    shippingMethod === 'standard'
                      ? 'border-secondary bg-cream text-primary ring-1 ring-secondary shadow-sm'
                      : 'border-divider bg-white text-muted hover:border-primary'
                  }`}
                >
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold block mb-0.5">
                      Standard Insured Shipping
                    </span>
                    <span className="text-[10px] text-muted/80 block">
                      Secure boxed courier. Arrives in 3-5 business days.
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-secondary">
                    {money(standardFee)}
                  </span>
                </button>

                <button
                  onClick={() => setShippingMethod('courier')}
                  className={`w-full p-4 border text-left flex justify-between items-center transition-all rounded-none ${
                    shippingMethod === 'courier'
                      ? 'border-secondary bg-cream text-primary ring-1 ring-secondary shadow-sm'
                      : 'border-divider bg-white text-muted hover:border-primary'
                  }`}
                >
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold block mb-0.5">
                      White Glove Delivery Service
                    </span>
                    <span className="text-[10px] text-muted/80 block">
                      Temperature controlled local transport. Arrives tomorrow before 6:00 PM.
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-secondary">
                    {money(courierFee)}
                  </span>
                </button>
              </div>

              <div className="pt-6 border-t border-divider flex justify-between">
                <button
                  onClick={handlePrev}
                  className="px-6 py-2.5 border border-divider hover:border-primary text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors rounded-none"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-primary hover:bg-secondary text-white uppercase text-xs tracking-widest font-semibold transition-colors duration-500 rounded-none"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment details */}
          {step === 3 && (
            <form onSubmit={handleNext} className="space-y-6">
              <h2 className="font-serif text-2xl text-primary border-b border-divider pb-3">
                3. {grandTotal > 0 ? 'Secure Credit Card Payment' : 'Payment'}
              </h2>

              {grandTotal === 0 ? (
                <div className="flex items-center gap-3 rounded-none border border-green-200 bg-green-50 px-4 py-4 text-xs text-green-700">
                  <ShieldCheck size={18} className="flex-shrink-0" />
                  <span>
                    This order is <span className="font-semibold">fully paid with {formatNumber(pointsDiscount)} membership points</span> — no card required.
                  </span>
                </div>
              ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-none border border-divider bg-cream/30 px-4 py-4 text-xs text-muted">
                  <CreditCard size={18} className="flex-shrink-0 mt-0.5 text-secondary" />
                  <span>
                    Card details are never entered here. When you place your order you are taken to
                    <span className="font-semibold text-primary"> SkipCash</span>, our payment provider, to pay
                    <span className="font-semibold text-primary"> QAR {grandTotal}</span> securely by Visa, MasterCard or American Express,
                    and brought straight back here afterwards.
                  </span>
                </div>
              </div>
              )}

              <div className="pt-6 border-t border-divider flex justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-2.5 border border-divider hover:border-primary text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors rounded-none"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary hover:bg-secondary text-white uppercase text-xs tracking-widest font-semibold transition-colors duration-500 rounded-none"
                >
                  Review Order
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Review and Place Order */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl text-primary border-b border-divider pb-3">
                4. Review & Place Order
              </h2>

              <div className="bg-cream border border-divider p-6 space-y-4 rounded-none text-xs text-muted">
                <div>
                  <h4 className="font-semibold text-primary uppercase tracking-wider mb-1">Shipping Address</h4>
                  <p>{firstName} {lastName}</p>
                  {selectedSaved && <p className="text-[10px] uppercase tracking-wider">{selectedSaved.label}</p>}
                  <p>{formatShippingAddress(deliveryAddr)}</p>
                  <p>Qatar</p>
                  <p>Contact: {email}</p>
                  <p>Sender phone: {formatLocalMobile(phone)}</p>
                  <p>Receiver phone: {formatLocalMobile(receiverPhone)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary uppercase tracking-wider mb-1">Delivery Speed</h4>
                  <p className="capitalize">{shippingMethod} Insured Service</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary uppercase tracking-wider mb-1">Payment Method</h4>
                  {grandTotal === 0 ? (
                    <p>Membership Points ({formatNumber(pointsDiscount)} pts)</p>
                  ) : (
                    <p>Card — paid securely on the SkipCash payment page</p>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-muted italic">
                By clicking &quot;Place Order&quot;, {grandTotal > 0
                  ? `you will be taken to SkipCash to pay QAR ${grandTotal} by card.`
                  : `this order will be paid in full with ${formatNumber(pointsDiscount)} membership points.`} All arrangements are final sale due to customized preserved biological makeup.
              </p>

              <div className="pt-6 border-t border-divider flex justify-between">
                <button
                  onClick={handlePrev}
                  className="px-6 py-2.5 border border-divider hover:border-primary text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors rounded-none"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="px-10 py-3.5 bg-primary hover:bg-secondary text-white uppercase text-xs tracking-[0.2em] font-semibold transition-colors duration-500 rounded-none shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {placing ? 'Placing Order…' : 'Place Order Now'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right: Order Summary Sidebar (Col: 5) */}
        <div className="lg:col-span-5">
          <div className="luxury-card p-6 space-y-6 sticky top-28">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">Order Summary</h3>
              <span className="text-[11px] text-muted uppercase tracking-wider">{cart.length} unique items</span>
            </div>

            {/* Sidebar list items scrollable */}
            <div className="max-h-[220px] overflow-y-auto space-y-4 pr-1 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs">
                  <div className="relative w-12 h-14 bg-cream flex-shrink-0 border border-divider/40 rounded-none">
                    {(() => {
                      const prodImage = ('image' in item.product && item.product.image) || 
                                       ('images' in item.product && item.product.images && item.product.images[0]) || 
                                       '';
                      return prodImage ? (
                        <Image src={prodImage} alt={item.product.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[7px] text-secondary font-bold text-center">BOX</div>
                      );
                    })()}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-primary truncate max-w-[180px]">{item.product.name}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">
                      {qar(item.price)} × {item.quantity} • {item.roseColor}
                    </p>
                  </div>
                  <span className="font-semibold text-primary/95 ml-2">{qar(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-divider pt-4">
              <CouponBox items={couponItems} onApplied={setAppliedCoupon} />
            </div>

            {/* Membership points — always shown; members redeem, others get a subscribe prompt */}
            <div className="border-t border-divider pt-4">
              <RedeemPointsBox maxRedeemable={total} onChange={setPointsRedeemed} />
            </div>

            {/* Price Calculations */}
            <div className="border-t border-divider pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{qar(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon{appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}</span>
                  <span>-{qar(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>{effectiveShipping === 0 ? 'Complimentary' : qar(effectiveShipping)}</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Points Redeemed</span>
                  <span>-{qar(pointsDiscount)}</span>
                </div>
              )}
              <div className="border-t border-divider pt-3 flex justify-between font-bold text-sm">
                <span className="uppercase tracking-widest text-xs">Estimated Total</span>
                <span className="text-secondary text-lg font-bold">{qar(grandTotal)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[10px] text-muted/80 pt-2 border-t border-divider/40">
              <ShieldCheck size={14} className="text-secondary" />
              <span>SSL 256-bit encrypted secure transactions</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
