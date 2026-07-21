'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import Link from 'next/link';
import { ChevronRight, CreditCard, ShieldCheck, CheckCircle2, Truck, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import Image from '../../../components/LuxuryImage';
import CouponBox from '../../../components/checkout/CouponBox';

interface FormErrors {
  [key: string]: string;
}

interface AppliedCoupon {
  code: string;
  discount: number;
  freeDelivery: boolean;
}

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart, user } = useApp();
  const [step, setStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Form Fields State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'courier'>('standard');

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});

  // Pre-fill the form with the signed-in user's saved details (without overwriting typed input).
  useEffect(() => {
    if (!user) return;
    setEmail((v) => v || user.email || '');
    setFirstName((v) => v || user.firstName || '');
    setLastName((v) => v || user.lastName || '');
    setPhone((v) => v || user.phone || '');
    setCity((v) => v || user.city || '');
  }, [user]);

  const subtotal = getCartTotal();
  const baseShippingFee = subtotal >= 150 ? 0 : 15;
  const shippingFee = shippingMethod === 'courier' ? baseShippingFee + 35 : baseShippingFee;
  const tax = Math.round(subtotal * 0.08);

  // Coupon-derived adjustments (default to no-ops when no coupon is applied).
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const effectiveShipping = appliedCoupon?.freeDelivery ? 0 : shippingFee;
  const total = Math.max(0, subtotal + effectiveShipping + tax - couponDiscount);

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
      if (!address.trim()) tempErrors.address = 'Street address is required';
      if (!city.trim()) tempErrors.city = 'City is required';
      if (!zip.match(/^\d{5}(-\d{4})?$/)) {
        tempErrors.zip = 'Enter a valid 5-digit zip code';
      }
      if (!phone.match(/^\+?[\d\s-]{10,15}$/)) {
        tempErrors.phone = 'Enter a valid phone number (min 10 digits)';
      }
    }

    if (step === 3) {
      if (!cardName.trim()) tempErrors.cardName = 'Cardholder name is required';
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (!cleanNum.match(/^\d{16}$/)) {
        tempErrors.cardNumber = 'Enter a valid 16-digit credit card number';
      }
      if (!cardExpiry.match(/^(0[1-9]|1[0-2])\/?([2-9][0-9])$/)) {
        tempErrors.cardExpiry = 'Enter expiry date in MM/YY format';
      }
      if (!cardCvv.match(/^\d{3,4}$/)) {
        tempErrors.cardCvv = 'Enter a valid 3 or 4 digit security code';
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

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center font-sans text-primary space-y-6">
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
          <p><span className="font-semibold text-primary">Order Reference:</span> #VF-{Math.floor(100000 + Math.random() * 900000)}</p>
          <p><span className="font-semibold text-primary">Shipping Address:</span> {address}, {city}, {zip}</p>
          <p><span className="font-semibold text-primary">Estimated Arrival:</span> {shippingMethod === 'courier' ? 'Tomorrow by 6:00 PM' : '3-5 Business Days'}</p>
        </div>
        <div className="pt-4">
          <Link
            href="/shop"
            className="inline-block bg-primary hover:bg-secondary text-white text-xs uppercase tracking-[0.2em] font-medium py-3.5 px-8 transition-colors duration-500 rounded-none shadow-md"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center font-sans">
        <h2 className="font-serif text-2xl mb-4">Your Cart is empty</h2>
        <Link href="/shop" className="text-secondary underline uppercase tracking-widest text-xs">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
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

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    id="co-address" aria-label="Street address" autoComplete="address-line1" aria-invalid={!!errors.address || undefined} aria-describedby={errors.address ? "co-address-err" : undefined} onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                    placeholder="Suite, apartment, street name"
                  />
                  {errors.address && <p id="co-address-err" role="alert" className="text-red-500 text-[10px] mt-1 font-medium">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      id="co-city" aria-label="City" autoComplete="address-level2" aria-invalid={!!errors.city || undefined} aria-describedby={errors.city ? "co-city-err" : undefined} onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                    />
                    {errors.city && <p id="co-city-err" role="alert" className="text-red-500 text-[10px] mt-1 font-medium">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      required
                      value={zip}
                      id="co-zip" aria-label="Zip code" autoComplete="postal-code" aria-invalid={!!errors.zip || undefined} aria-describedby={errors.zip ? "co-zip-err" : undefined} onChange={(e) => setZip(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                      placeholder="e.g. 10012"
                    />
                    {errors.zip && <p id="co-zip-err" role="alert" className="text-red-500 text-[10px] mt-1 font-medium">{errors.zip}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    id="co-phone" aria-label="Phone number" autoComplete="tel" inputMode="tel" aria-invalid={!!errors.phone || undefined} aria-describedby={errors.phone ? "co-phone-err" : undefined} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                    placeholder="e.g. 212-555-0199"
                  />
                  {errors.phone && <p id="co-phone-err" role="alert" className="text-red-500 text-[10px] mt-1 font-medium">{errors.phone}</p>}
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
                    {subtotal >= 150 ? 'Complimentary' : 'QAR 15'}
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
                    {subtotal >= 150 ? '+QAR 35' : 'QAR 50'}
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
                3. Secure Credit Card Payment
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                    placeholder="Name as printed on front of card"
                  />
                  {errors.cardName && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.cardName}</p>}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                      maxLength={19}
                      className="w-full pl-10 pr-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                      placeholder="0000 0000 0000 0000"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted/50">
                      <CreditCard size={16} />
                    </span>
                  </div>
                  {errors.cardNumber && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.cardNumber}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 2) {
                          setCardExpiry(val);
                        } else {
                          setCardExpiry(`${val.slice(0, 2)}/${val.slice(2, 4)}`);
                        }
                      }}
                      maxLength={5}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs text-center rounded-none"
                    />
                    {errors.cardExpiry && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.cardExpiry}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                      CVV / Security Code
                    </label>
                    <input
                      type="password"
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      maxLength={4}
                      placeholder="3 or 4 digits"
                      className="w-full px-4 py-2.5 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs text-center rounded-none"
                    />
                    {errors.cardCvv && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.cardCvv}</p>}
                  </div>
                </div>
              </div>

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
                  <p>{address}</p>
                  <p>{city}, {zip}</p>
                  <p>Contact: {email} | {phone}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary uppercase tracking-wider mb-1">Delivery Speed</h4>
                  <p className="capitalize">{shippingMethod} Insured Service</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary uppercase tracking-wider mb-1">Payment Method</h4>
                  <p>Visa Credit ending in *{cardNumber.replace(/\s+/g, '').slice(-4)}</p>
                </div>
              </div>

              <p className="text-[11px] text-muted italic">
                By clicking "Place Order", you authorize charging ${total} to your credit card. All arrangements are final sale due to customized preserved biological makeup.
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
                  className="px-10 py-3.5 bg-primary hover:bg-secondary text-white uppercase text-xs tracking-[0.2em] font-semibold transition-colors duration-500 rounded-none shadow-md"
                >
                  Place Order Now
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
                      Qty: {item.quantity} • {item.roseColor}
                    </p>
                  </div>
                  <span className="font-semibold text-primary/95 ml-2">${item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-divider pt-4">
              <CouponBox items={couponItems} onApplied={setAppliedCoupon} />
            </div>

            {/* Price Calculations */}
            <div className="border-t border-divider pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>${subtotal}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon{appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}</span>
                  <span>-${couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>{effectiveShipping === 0 ? 'Complimentary' : `$${effectiveShipping}`}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Estimated Taxes</span>
                <span>${tax}</span>
              </div>
              <div className="border-t border-divider pt-3 flex justify-between font-bold text-sm">
                <span className="uppercase tracking-widest text-xs">Estimated Total</span>
                <span className="text-secondary text-lg font-bold">${total}</span>
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
