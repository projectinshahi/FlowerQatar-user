'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Cake,
  ChevronLeft,
  ChevronRight,
  Clover,
  Flower,
  Gift,
  Heart,
  HeartHandshake,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LuxuryImage from '@/components/LuxuryImage';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useAddOns,
  useDeliveryDates,
  useGreetingCards,
  usePriceCalculator,
  type AddOn,
} from '@/hooks/useProductOptions';
import type { Product } from '@/types';
import BlushingNav from './BlushingNav';
import { GWENDOLYN_CSS, WISHING_FONTS, blushingFontVars, wishingFontCss, type WishingFontKey } from './fonts';

/**
 * Blushing Blooms product page (Figma "Desktop - 7", node 156:1318).
 *
 * This is the whole page for a Blushing Blooms product, not a dialog — clicking a card in the
 * listing navigates here at /product/[slug], and the back chevron returns to the listing.
 * app/(client)/product/[slug]/page.tsx routes BLUSHING_BLOOMS products to this instead of the
 * shared ProductDetailClient; every other category is untouched.
 *
 * It owns no business logic. Options come from the same hooks the shared product page uses
 * (useAddOns / useGreetingCards / useDeliveryDates), the total from the same usePriceCalculator,
 * and the basket write is the same `addToCart` contract. What is new is the surface and the
 * WISHING FONT control, which the shared page has commented out.
 *
 * `data-bb-page` on the root hides the storefront chrome and turns on the dark scoped rules in
 * globals.css, exactly as the listing does.
 */


const GOLD = '#cc965a';
const HAIRLINE = 'rgba(204,150,90,0.2)';
const TILE_BORDER = 'rgba(204,150,90,0.5)';
const TILE_BG = 'rgba(204,150,90,0.05)';
const TILE_BG_ON = 'rgba(204,150,90,0.25)';

/** Greeting templates are seeded rows; the glyph is matched on name, with a neutral default. */
const CARD_ICONS: Record<string, LucideIcon> = {
  Birthday: Cake,
  Congratulations: Sparkles,
  'Thank You': HeartHandshake,
  Anniversary: Clover,
  'Classic Cream': Flower,
  'With Love': Heart,
};

const qar = (n: number) => `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }).toUpperCase();

/** Section heading — Montserrat Medium 20/0.8 in the design, stepped down on small screens. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-medium tracking-[0.04em] text-white sm:text-[15px] lg:text-[16px]">{children}</h3>;
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <p className="flex items-center gap-2 text-[13px] text-red-400">
      <AlertCircle size={14} /> {message}
      <button type="button" onClick={onRetry} className="underline underline-offset-2">Retry</button>
    </p>
  );
}

export default function BlushingProductDetail({ product }: { product: Product }) {
  const { addToCart } = useApp();

  const [colorName, setColorName] = useState<string | null>(null);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [font, setFont] = useState<WishingFontKey | null>(null);

  const gifts = useAddOns();
  const cards = useGreetingCards();
  const dates = useDeliveryDates();

  // Reset every choice when a different product is opened, so nothing leaks between products.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColorName(product?.colors?.[0]?.name ?? null);
    setAddOns([]);
    setDate(null);
    setTemplateId(null);
    setMessage('');
    setFont(null);
  }, [product?.id, product?.slug, product?.colors]);

  const selectedColor = product?.colors?.find((c) => c.name === colorName) ?? product?.colors?.[0] ?? null;
  const heroImage = selectedColor?.image || product?.image || '';
  const pricing = usePriceCalculator(product?.price ?? 0, 1, addOns);
  const selectedCard = cards.data?.find((c) => c.id === templateId) ?? null;

  const toggleGift = (g: AddOn) =>
    setAddOns((cur) => (cur.some((a) => a.id === g.id) ? cur.filter((a) => a.id !== g.id) : [...cur, g]));

  // ---- Horizontal date rail: arrows + a progress thumb, as drawn in the design ----
  const rail = useRef<HTMLDivElement>(null);
  const [railPos, setRailPos] = useState({ ratio: 0, visible: 1 });
  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setRailPos({
      ratio: max > 0 ? el.scrollLeft / max : 0,
      visible: el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1,
    });
  }, []);
  useEffect(() => {
    measure();
  }, [measure, dates.data]);
  const nudge = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * (rail.current.clientWidth * 0.8), behavior: 'smooth' });

    const handleAddToCart = () => {
    addToCart({
      product: { id: product.id, slug: product.slug, name: product.name, price: pricing.unitPrice, image: product.image },
      quantity: 1,
      roseColor: selectedColor?.name || 'Default',
      boxColor: 'Standard',
      price: pricing.unitPrice,
      addOns: addOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      deliveryDate: date || undefined,
      greetingTemplateId: templateId || undefined,
      greetingMessage: templateId ? message || undefined : undefined,
      // The wishing font is stored on the greeting style the cart already carries; colour and
      // size keep the existing defaults because this design exposes neither.
      greetingStyle: templateId && font ? { color: '#1A1A1A', font, size: 'md' } : undefined,
      calculatedPrice: pricing.subtotal,
    });
  };

  const tile = (on: boolean) =>
    `rounded-[12px] px-3 py-2 text-left transition-colors ${on ? 'text-white' : 'text-white hover:border-[rgba(204,150,90,0.8)]'}`;

  return (
    <div
      data-bb-page
      className={`${blushingFontVars} min-h-screen bg-black font-sans text-white [overflow-x:clip]`}
    >
      <BlushingNav />

          {/*
            Container geometry is copied from components/client/product/ProductDetailClient.tsx
            so both product pages are the same size at every breakpoint: max-w-[1440px], the same
            horizontal and vertical padding, the same 60/40 split at `lg` with the same gap.
            Only the surface differs — dark ground, gold accents, Blushing Blooms type.
          */}
          <div className="mx-auto w-full max-w-[1440px] px-0 pb-16 pt-32 md:px-12 lg:pb-24 lg:pt-40">
            {/* Back control — the design uses a back chevron rather than a close cross. */}
            <Link
              href="/shop?category=blushing-blooms"
              aria-label="Back to Blushing Blooms"
              className="mb-6 ml-4 flex h-12 w-12 items-center justify-center rounded-full border text-white transition-colors hover:bg-white/5 md:ml-0 lg:mb-8"
              style={{ borderColor: HAIRLINE }}
            >
              <ChevronLeft size={26} strokeWidth={1.5} />
            </Link>

            <div className="flex flex-col gap-0 lg:flex-row lg:items-start lg:gap-16">
              {/* ---------------------------------------------------------- Media */}
              <div className="w-full px-4 md:px-0 lg:sticky lg:top-40 lg:w-[60%] lg:pr-8">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px] bg-[#0d0b0b]">
                  {heroImage ? (
                    <LuxuryImage
                      src={heroImage}
                      alt={product.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 650px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </div>

              {/* ---------------------------------------------------------- Detail */}
              <div className="flex w-full min-w-0 flex-col gap-8 px-6 pb-12 pt-8 md:px-0 lg:w-[40%] lg:shrink-0 lg:gap-[38px] lg:pt-0">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b pb-8 lg:gap-6 lg:pb-[60px]" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <h1 className="font-serif text-[26px] font-semibold capitalize leading-tight tracking-[0.08em] text-white sm:text-[30px] lg:text-[34px] lg:tracking-[0.1em]">
                    {product.name}
                  </h1>

                  <div className="flex flex-col gap-2">
                    <p className="text-[18px] font-medium tracking-[0.1em] text-white sm:text-[20px]">
                      {qar(product.price)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <span className="flex items-center gap-1.5" aria-hidden="true">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={20}
                            strokeWidth={1.5}
                            className="lg:h-6 lg:w-6"
                            style={{
                              color: GOLD,
                              fill: i < Math.round(product.rating ?? 0) ? GOLD : 'transparent',
                            }}
                          />
                        ))}
                      </span>
                      <p className="text-[14px] tracking-[0.02em] text-white/70 sm:text-[16px]">
                        <span className="sr-only">Rated </span>
                        {(product.rating ?? 5).toFixed(1)}
                        <span className="sr-only"> out of 5</span>
                        {/* Hidden at zero rather than advertising "(0 Reviews)". */}
                        {product.reviewCount > 0 && ` (${product.reviewCount} Reviews)`}
                      </p>
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-[13px] leading-relaxed tracking-[0.04em] text-white/50 sm:text-[15px]">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Colour */}
                {product.colors?.length > 0 && (
                  <section className="flex flex-col gap-5 lg:gap-[26px]">
                    <SectionLabel>CHOOSE COLOR</SectionLabel>
                    <div className="flex flex-wrap items-center gap-[18px]">
                      {product.colors.map((c) => {
                        const on = c.name === colorName;
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setColorName(c.name)}
                            aria-pressed={on}
                            aria-label={c.name}
                            title={c.name}
                            suppressHydrationWarning
                            className={`h-9 w-9 rounded-full transition-shadow lg:h-10 lg:w-10 ${
                              on ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'ring-1 ring-white/15'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Gifts */}
                <section className="flex flex-col gap-5 lg:gap-[26px]">
                  <SectionLabel>ADD A GIFT</SectionLabel>
                  {gifts.loading ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[106px] rounded-[24px]" />)}
                    </div>
                  ) : gifts.error ? (
                    <LoadError message={gifts.error} onRetry={gifts.reload} />
                  ) : !gifts.data?.length ? (
                    <p className="text-[13px] text-white/40">No gifts available.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {gifts.data.map((g) => {
                        const on = addOns.some((a) => a.id === g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggleGift(g)}
                            suppressHydrationWarning
                            className="flex items-start gap-2 rounded-[24px] border px-2 py-3 text-left transition-colors"
                            style={{
                              borderColor: on ? GOLD : HAIRLINE,
                              backgroundColor: on ? TILE_BG_ON : 'transparent',
                            }}
                          >
                            <span className="flex min-w-0 flex-1 flex-col gap-1 pl-1">
                              <span className="text-[15px] leading-tight tracking-[0.04em] text-white/70 lg:text-[18px]">{g.name}</span>
                              {/* QAR strings are longer than the mock's "₹ 45" and would wrap. */}
                              <span className="whitespace-nowrap text-[17px] font-medium tracking-[0.04em] text-white/30 lg:text-[20px]">
                                {qar(g.price)}
                              </span>
                            </span>
                            <span className="relative h-16 w-16 shrink-0 lg:h-20 lg:w-20">
                              {g.image ? (
                                <LuxuryImage src={g.image} alt="" fill sizes="80px" className="object-contain" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-white/25">
                                  <Gift size={26} strokeWidth={1.5} />
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Delivery date */}
                <section className="flex flex-col gap-5 lg:gap-[26px]">
                  <SectionLabel>DELIVERY DATE</SectionLabel>
                  {dates.loading ? (
                    <div className="flex gap-3">
                      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[68px] w-[100px] rounded-[12px]" />)}
                    </div>
                  ) : dates.error ? (
                    <LoadError message={dates.error} onRetry={dates.reload} />
                  ) : !dates.data?.length ? (
                    <p className="text-[13px] text-white/40">No delivery dates available.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div ref={rail} onScroll={measure} className="no-scrollbar flex gap-3 overflow-x-auto lg:gap-[14px]">
                        {dates.data.map((d) => {
                          const on = date === d;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDate(d)}
                              aria-pressed={on}
                              suppressHydrationWarning
                              className={`${tile(on)} shrink-0 border`}
                              style={{
                                borderColor: on ? GOLD : TILE_BORDER,
                                backgroundColor: on ? GOLD : 'transparent',
                              }}
                            >
                              <span className="block text-[14px] tracking-[0.04em] text-white/50 lg:text-[18px]">{fmtDay(d)}</span>
                              <span className="mt-1 block whitespace-nowrap text-[16px] font-medium tracking-[0.04em] text-white/70 lg:text-[20px]">
                                {fmtDate(d)}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Rail controls. Hidden from assistive tech: the rail itself is keyboard
                          scrollable and every date is already a focusable button. */}
                      <div className="flex items-center gap-2" aria-hidden="true">
                        <button type="button" onClick={() => nudge(-1)} tabIndex={-1} className="text-white/60 transition-colors hover:text-white">
                          <ChevronLeft size={22} strokeWidth={1.5} />
                        </button>
                        <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/5">
                          <span
                            className="absolute inset-y-0 rounded-full bg-white/25 transition-[left] duration-150"
                            style={{
                              width: `${railPos.visible * 100}%`,
                              left: `${railPos.ratio * (100 - railPos.visible * 100)}%`,
                            }}
                          />
                        </span>
                        <button type="button" onClick={() => nudge(1)} tabIndex={-1} className="text-white/60 transition-colors hover:text-white">
                          <ChevronRight size={22} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Greeting card */}
                <section className="flex flex-col gap-5 lg:gap-[32px]">
                  <SectionLabel>GREETING CARD</SectionLabel>
                  {cards.loading ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[92px] w-[180px] rounded-[24px]" />)}
                    </div>
                  ) : cards.error ? (
                    <LoadError message={cards.error} onRetry={cards.reload} />
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-[9px]">
                        <button
                          type="button"
                          onClick={() => setTemplateId(null)}
                          aria-pressed={!templateId}
                          suppressHydrationWarning
                          className="flex h-[76px] min-w-[140px] flex-1 items-center justify-center rounded-[24px] border px-6 text-center font-serif text-[15px] font-medium tracking-[0.04em] text-white/70 transition-colors sm:flex-none sm:px-7 lg:h-[92px] lg:w-[191px] lg:text-[18px]"
                          style={{
                            borderColor: !templateId ? GOLD : HAIRLINE,
                            backgroundColor: !templateId ? TILE_BG_ON : TILE_BG,
                          }}
                        >
                          NO CARD
                        </button>
                        {(cards.data ?? []).map((c) => {
                          const on = templateId === c.id;
                          const Icon = CARD_ICONS[c.name] ?? Flower;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setTemplateId(c.id)}
                              aria-pressed={on}
                              suppressHydrationWarning
                              className="flex min-w-[140px] flex-1 flex-col items-center justify-center gap-3 rounded-[24px] border px-6 py-3.5 text-center transition-colors sm:flex-none sm:px-7 lg:gap-4"
                              style={{ borderColor: on ? GOLD : HAIRLINE, backgroundColor: on ? TILE_BG_ON : TILE_BG }}
                            >
                              <Icon size={24} className="shrink-0" style={{ color: GOLD }} />
                              <span className="font-serif text-[15px] font-medium uppercase tracking-[0.04em] text-white/70 lg:text-[18px]">
                                {c.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Message + live preview appear only once a card is chosen. */}
                      {selectedCard && (
                        <div className="flex flex-col gap-3 lg:flex-row lg:gap-[12px]">
                          <label className="sr-only" htmlFor="bb-greeting-message">Greeting message</label>
                          <textarea
                            id="bb-greeting-message"
                            value={message}
                            maxLength={250}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={`Write your message for the '${selectedCard.name}' card...`}
                            suppressHydrationWarning
                            className="w-full resize-none rounded-[24px] border px-6 pb-8 pt-3.5 font-serif text-[15px] tracking-[0.04em] text-white placeholder:text-white/50 focus:outline-none lg:w-[310px] lg:px-7 lg:pb-[121px] lg:text-[18px]"
                            style={{ borderColor: HAIRLINE, fontFamily: font ? wishingFontCss(font) : undefined }}
                            rows={4}
                          />

                          <div
                            className="flex w-full flex-col items-center justify-center rounded-[24px] px-6 py-7 text-center lg:h-[181px] lg:w-[345px] lg:px-[31px] lg:py-[33px]"
                            style={{ background: 'radial-gradient(closest-side, #FDD6AA, #FFBE75)' }}
                          >
                            <span className="flex flex-col items-center gap-[3px]">
                              {(() => {
                                const Icon = CARD_ICONS[selectedCard.name] ?? Flower;
                                return <Icon size={24} className="text-black/70" />;
                              })()}
                              <span className="text-[22px] tracking-[0.04em] text-black/70 lg:text-[24px]" style={{ fontFamily: GWENDOLYN_CSS }}>
                                {selectedCard.name}
                              </span>
                            </span>
                            <p
                              className="mt-4 whitespace-pre-wrap break-words text-[14px] leading-snug tracking-[0.04em] text-black/70 lg:mt-[19px] lg:text-[16px]"
                              style={{ fontFamily: font ? wishingFontCss(font) : undefined }}
                            >
                              {message || 'Wishing you a day filled with love, joy, beautiful moments'}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>

                {/* Wishing font */}
                <section className="flex flex-col gap-5 lg:gap-[26px]">
                  <SectionLabel>WISHING FONT</SectionLabel>
                  {/*
                    Always a rail, never a wrap. Six 100px tiles need 670px; the detail column
                    only reaches that at the design's own 1440 width, so between lg and there it
                    scrolls rather than reflowing into a ragged second row.
                  */}
                  <div className="no-scrollbar flex gap-3 overflow-x-auto lg:gap-[14px]">
                    {WISHING_FONTS.map((f) => {
                      const on = font === f.key;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setFont(on ? null : f.key)}
                          aria-pressed={on}
                          suppressHydrationWarning
                          className={`${tile(on)} h-[78px] w-[100px] shrink-0 border`}
                          style={{ borderColor: on ? GOLD : TILE_BORDER, backgroundColor: on ? TILE_BG_ON : 'transparent' }}
                        >
                          <span className="block text-[20px] leading-none text-white/70" style={{ fontFamily: f.css }}>Aa</span>
                          <span className="mt-2 block truncate text-[14px] tracking-[0.04em] text-white/50 lg:text-[18px]">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Summary + CTA */}
                <section className="flex flex-col gap-4 lg:gap-[16px]">
                  <div className="rounded-[24px] border" style={{ borderColor: HAIRLINE }}>
                    <div className="flex items-center justify-between border-b px-5 py-5 lg:px-5 lg:py-6" style={{ borderColor: HAIRLINE }}>
                      <span className="text-[15px] tracking-[0.04em] text-white/70 lg:text-[20px]">Base Price</span>
                      <span className="text-[15px] tracking-[0.04em] text-white/70 lg:text-[20px]">{qar(product.price)}</span>
                    </div>
                    {addOns.map((a) => (
                      <div key={a.id} className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: HAIRLINE }}>
                        <span className="text-[14px] tracking-[0.04em] text-white/50 lg:text-[16px]">{a.name}</span>
                        <span className="text-[14px] tracking-[0.04em] text-white/50 lg:text-[16px]">{qar(a.price)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-5 py-5 lg:px-5 lg:py-6">
                      <span className="text-[16px] font-medium tracking-[0.04em] text-white lg:text-[20px]">Subtotal</span>
                      <span className="text-[16px] font-medium tracking-[0.04em] text-white lg:text-[20px]">{qar(pricing.subtotal)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    suppressHydrationWarning
                    className="flex h-12 w-full items-center justify-center rounded-[24px] text-[13px] font-medium uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 lg:h-10"
                    style={{ backgroundColor: GOLD }}
                  >
                    Add to Cart
                  </button>
                </section>
              </div>
            </div>
          </div>
    </div>
  );
}
