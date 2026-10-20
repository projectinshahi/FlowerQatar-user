'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Play,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LuxuryImage from '@/components/LuxuryImage';
import { isVideoMedia, videoPoster, videoSrc } from '@/lib/media';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useAddOns,
  useDeliveryDates,
  useGreetingCards,
  usePriceCalculator,
  type AddOn,
} from '@/hooks/useProductOptions';
import type { Product } from '@/types';
import type { StoreGiftGroup } from '@/lib/gifts';
import GiftSection from '@/components/client/product/GiftSection';
import { ProductUnavailableNotice, useProductAvailable } from '@/components/client/product/ProductAvailability';
import BlushingNav from './BlushingNav';
import { GWENDOLYN_CSS, WISHING_FONTS, blushingFontVars, wishingFontCss, type WishingFontKey } from './fonts';
import {
  BlushingBackButton,
  CARD_BORDER,
  ColorSwatch,
  GOLD,
  GoldButton,
  PRICE_GRADIENT,
  StarRating,
  TILE_BG,
  TILE_BG_ON,
  TILE_BORDER,
} from './ui';
import { formatNumber, formatUtcDate } from '@/lib/utils';

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


/**
 * The three ambient gold pools of the Figma frame (156:1318): top-right, middle-left,
 * bottom-right.
 *
 * These are the page root's own `background-image`, NOT positioned children. They used to be
 * three absolutely-positioned <Glow> spans at `-z-10`, and they were invisible — nothing
 * between them and the root establishes a stacking context, so a negative z-index put them
 * behind the root's own `bg-black` AND behind `body:has([data-bb-page]){background:#000}` in
 * globals.css. Sampled at the edges the page came back rgb(0,0,0) at every scroll position, at
 * any opacity. Painting them as the background instead removes the layering question entirely:
 * a background cannot be occluded by the box it belongs to, and content still stacks above it.
 *
 * Percentage centres, so the pools track the page rather than a fixed pixel offset — Blushing
 * pages vary in height with the number of gifts and greeting cards. Radii are vw-clamped so the
 * pools stay in proportion from a 390px phone to a wide desktop instead of flooding the former.
 *
 * Peak alpha 0.34 over black is rgb(69,51,31) — a warm bloom that reads clearly at normal
 * display brightness while leaving white body text at a contrast ratio well above AA. Each pool
 * is centred ON its edge, so what crosses into the content area is the falloff, and the four
 * stops take it to fully transparent by 80% of the radius — no visible disc, no hard edge.
 *
 * The middle-left pool is the strongest and the tallest of the three, and that is a consequence
 * of the layout rather than a taste call: at `lg` the left column is the sticky product frame,
 * which is opaque, so the only ground that can show this pool is the 40px gutter beside it plus
 * whatever opens up below it. Spread over a taller band at a higher alpha, it reads as light
 * spilling around the frame across the whole middle of the page instead of a sliver that only
 * resolves at one scroll position. Below `lg` the column is full-bleed and it reads in full.
 */
const GOLD_POOLS = [
  ['clamp(26rem,46vw,50rem) clamp(22rem,34vw,40rem) at 100% 7%', 0.34],
  ['clamp(28rem,52vw,56rem) clamp(30rem,50vw,58rem) at 0% 50%', 0.44],
  ['clamp(26rem,46vw,50rem) clamp(22rem,34vw,40rem) at 100% 92%', 0.34],
]
  .map(
    ([shape, a]) =>
      `radial-gradient(${shape}, rgba(204,150,90,${a}), rgba(204,150,90,${(a as number * 0.48).toFixed(3)}) 38%, rgba(204,150,90,${(a as number * 0.16).toFixed(3)}) 62%, rgba(204,150,90,0) 80%)`,
  )
  .join(',');

/** Section rules between blocks — the one value still derived from the gold. */
const HAIRLINE = 'rgba(204,150,90,0.2)';

/** Greeting templates are seeded rows; the glyph is matched on name, with a neutral default. */
const CARD_ICONS: Record<string, LucideIcon> = {
  Birthday: Cake,
  Congratulations: Sparkles,
  'Thank You': HeartHandshake,
  Anniversary: Clover,
  'Classic Cream': Flower,
  'With Love': Heart,
};

const qar = (n: number) => `QAR ${formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDay = (d: string) => formatUtcDate(d, { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
const fmtDate = (d: string) => formatUtcDate(d, { day: 'numeric', month: 'short', timeZone: 'UTC' }).toUpperCase();

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

/**
 * Figma's ADD A GIFT tiles ship artwork per gift; the catalogue rows don't carry one yet, so the
 * six designed gifts are matched by a distinctive token in their name (covers the "Teddy Beer" /
 * "Baloon" spellings in the mock). Anything else still falls back to the row's own image.
 */
const GIFT_ART: [RegExp, string][] = [
  [/chocolate/, '/images/image 50.png'],
  [/teddy/, '/images/image 61.png'],
  [/loon/, '/images/image 62.png'],
  [/crystal/, '/images/image 53.png'],
  [/ribbon/, '/images/image 55.png'],
  [/wrap/, '/images/image 54.png'],
];
const giftArt = (name: string, fallback: string | null) =>
  GIFT_ART.find(([re]) => re.test(name.toLowerCase()))?.[1] ?? fallback;

export default function BlushingProductDetail({
  product,
  giftGroups = [],
  published = true,
}: {
  product: Product;
  /** Server-rendered status check; false once the product is unpublished (see ProductAvailability). */
  published?: boolean;
  /** Gifts the admin configured for this product's category; empty renders nothing. */
  giftGroups?: StoreGiftGroup[];
}) {
  const { addToCart } = useApp();
  const available = useProductAvailable(product.id, published);

  const [colorName, setColorName] = useState<string | null>(null);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [font, setFont] = useState<WishingFontKey | null>(null);
  const [shownUrl, setShownUrl] = useState<string | null>(null);

  const gifts = useAddOns();
  const cards = useGreetingCards();
  const dates = useDeliveryDates();

  /*
   * Open at the top of the page.
   *
   * The App Router normally does this itself, but every route under app/(client) is wrapped in
   * template.tsx, which animates `y: 12 -> 0` on each navigation. The transform that puts on the
   * wrapper is applied around the moment the router measures where to scroll, so the reset was
   * being computed against a moving element and the previous scroll offset survived the
   * navigation. Coming from the listing — where you are always scrolled down, because that is
   * where the product cards are — that dropped you into the middle of the details column.
   *
   * Keyed on the slug so it also fires when moving straight from one product to another, which
   * reuses this component rather than remounting it. 'instant' because a smooth scroll here
   * would animate the page upward in front of the reader on arrival.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [product?.slug]);

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
  // The colour's Color Swatch upload, image or video — the mapper puts it in `image`.
  const heroImage = selectedColor?.image || product?.image || '';

  /*
   * Gallery Media thumbnails: the selected colour's uploads in admin order. The resting hero is
   * put first when it is not already one of them (a swatch-only hero), so a shopper can always get
   * back to it. The choice is kept as a URL, not an index — after a colour change a URL from the
   * old colour simply is not in the new strip, and the frame falls back to the hero with no reset.
   */
  const galleryItems = (selectedColor ? selectedColor.gallery : product?.gallery) ?? [];
  const thumbs = galleryItems.length
    ? [
        ...(heroImage && !galleryItems.some((m) => m.url === heroImage)
          ? [{ url: heroImage, type: isVideoMedia({ url: heroImage }) ? ('video' as const) : ('image' as const) }]
          : []),
        ...galleryItems,
      ]
    : [];
  const shown = shownUrl && shownUrl !== heroImage ? thumbs.find((m) => m.url === shownUrl) ?? null : null;
  const frameSrc = shown?.url ?? heroImage;
  const pricing = usePriceCalculator(product?.price ?? 0, 1, addOns);
  const selectedCard = cards.data?.find((c) => c.id === templateId) ?? null;

  /*
   * Whether the ADD A GIFT section has anything to say.
   *
   * It used to render its heading unconditionally and fall through to a bare "No gifts
   * available." line, so a product whose category has no gift group showed a heading over
   * a placeholder. Loading and error still count as something to show: the first draws the
   * skeletons that hold the space, the second a retry the customer needs to see.
   */
  const showGifts =
    giftGroups.length > 0 || gifts.loading || !!gifts.error || !!gifts.data?.length;

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
    if (!available) return;
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

  /* Shared by the delivery-date rail and the wishing-font row. Fluid padding so the tiles
     shrink with the column instead of holding a laptop-sized footprint at every width. */
  const tile = (on: boolean) =>
    `rounded-[12px] px-[clamp(0.625rem,0.593rem_+_0.1307vw,0.75rem)] py-[clamp(0.375rem,0.343rem_+_0.1307vw,0.5rem)] text-left transition-colors ${on ? 'text-white' : 'text-white hover:border-[rgba(204,150,90,0.8)]'}`;

  return (
    <div
      data-bb-page
      className={`${blushingFontVars} min-h-screen bg-black font-sans text-white [overflow-x:clip]`}
      style={{ backgroundImage: GOLD_POOLS }}
    >
      <BlushingNav />
      <BlushingBackButton href="/shop?category=blushing-blooms" label="Back to Blushing Blooms" />

          {/*
            Container geometry is copied from components/client/product/ProductDetailClient.tsx
            so both product pages are the same size at every breakpoint: max-w-[1440px], the same
            horizontal and vertical padding, the same 60/40 split at `lg` with the same gap.
            Only the surface differs — dark ground, gold accents, Blushing Blooms type.
          */}
          <div className="relative mx-auto w-full max-w-[1440px] px-0 pb-16 pt-32 md:px-[clamp(1.5rem,4vw,3rem)] lg:px-10 lg:pb-24 lg:pt-40">

            {/*
              Proportions taken from the Figma frame, not estimated: within its 1360px content
              width the gallery is 650px, the gap 28px and the details column 682px — 47.8% /
              2.1% / 50.1%. The page had been running 62/38 with a 64px gap, which is why the
              details column felt cramped and the gift grid crowded next to the reference.
            */}
            <div className="flex flex-col gap-0 lg:flex-row lg:items-start lg:gap-[2.1%]">
              {/* ---------------------------------------------------------- Media */}
              {/*
                Pinned from the top, so the gallery holds still and only the details scroll.

                4.5rem (72px) is not arbitrary: the frame below is capped at `100vh - 6rem`, so
                pinning its top at 72px puts its bottom at `100vh - 24px` — the whole image on
                screen with the same 24px breathing room it had before. Any larger a top offset
                would push the bottom off the fold.

                The column still starts at the container's `lg:pt-40` (160px), so there are 88px
                of scroll before it reaches the pin. That is inherent to sticky — the element
                cannot pin above where the document places it — and `position: fixed` is not a
                substitute, as it would drop the column out of flow and collapse the two-column
                layout.

                Plain CSS sticky, so the hand-off is frame-perfect: no scroll listener, nothing
                to jank.

                Still `lg:` only. Below that the layout is stacked and full-bleed, where pinning
                the gallery would eat the screen the details need.
              */}
              <div className="w-full px-4 md:px-0 lg:sticky lg:top-[4.5rem] lg:w-[47.8%] lg:pr-0">
                {/*
                  Height-capped so the WHOLE image is on screen when it pins.

                  At its natural size the 4:5 frame is ~970px tall against a ~800px laptop
                  viewport, so "fully visible, then fixed" is impossible — the top would always
                  be above the fold. The cap is expressed as a width because that is the axis
                  `aspect-ratio` derives from: take the shorter of the column's own width and the
                  width a viewport-tall frame would have (height x 4/5), and the ratio then
                  yields a height that fits. The 0.912 factor IS the aspect ratio (650/713) — the
                  two move together, so changing one without the other breaks the cap.

                  `min()` is what keeps this from being a downgrade on large displays — past
                  roughly 1360px of viewport height the column width wins and the image renders
                  at exactly its designed size, unchanged.

                  8rem (128px) is the height budget given up to chrome. It is what trades
                  height for width here: raising it shortens and narrows the frame together,
                  lowering it grows both.

                  Where the frame SITS is a separate number — the column's `lg:top-[4.5rem]`
                  (72px). Because the nav ends at 100px, the top ~28px of the image rests behind
                  it. That is deliberate: the nav is translucent glass over a blur, so the image
                  reads through rather than being hidden, the same way the hero runs under it on
                  the listing.

                  The floating back button overlaps the top-left corner by design; it is a
                  control over the page, not part of this column's flow.
                */}
                {/*
                  With a thumbnail strip the height budget grows by the strip (72px + 12px gap, ~5.5rem
                  with its scroll gutter), so frame + strip still fit on screen when the column pins.
                  Without one the class is the original, byte for byte.
                */}
                <div className={`relative aspect-[650/713] w-full overflow-hidden rounded-[24px] bg-[#0d0b0b] lg:mx-auto ${thumbs.length ? 'lg:w-[min(100%,calc((100vh-13.5rem)*0.912))]' : 'lg:w-[min(100%,calc((100vh-8rem)*0.912))]'}`}>
                  {frameSrc ? (
                    <LuxuryImage
                      key={frameSrc}
                      src={frameSrc}
                      alt={product.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 650px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                {thumbs.length > 0 && (
                  <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1 lg:mx-auto lg:w-[min(100%,calc((100vh-13.5rem)*0.912))]">
                    {thumbs.map((m, i) => {
                      const on = m.url === frameSrc;
                      const video = m.type === 'video';
                      return (
                        <button
                          key={m.url}
                          type="button"
                          data-gallery-thumb
                          onClick={() => setShownUrl(m.url)}
                          aria-label={`Show ${video ? 'video' : 'image'} ${i + 1} of ${thumbs.length}`}
                          aria-pressed={on}
                          className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-[12px] border transition-colors sm:w-[72px]"
                          style={{ borderColor: on ? GOLD : TILE_BORDER, backgroundColor: TILE_BG }}
                        >
                          {video ? (
                            <>
                              <video src={videoSrc(m.url, 320)} poster={videoPoster(m.url)} preload="metadata" muted playsInline tabIndex={-1} aria-hidden="true" className="pointer-events-none h-full w-full object-cover" />
                              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/35">
                                <Play size={16} className="fill-white text-white" />
                              </span>
                            </>
                          ) : (
                            <LuxuryImage src={m.url} alt="" fill sizes="72px" className="object-cover" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------------- Detail */}
              <div className="flex w-full min-w-0 flex-col gap-8 px-6 pb-12 pt-8 md:px-0 lg:w-[50.1%] lg:shrink-0 lg:gap-[38px] lg:pt-0">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b pb-8 lg:gap-6 lg:pb-[60px]" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <h1 className="font-serif text-[clamp(1.625rem,2.4vw,2.125rem)] font-semibold capitalize leading-tight tracking-[0.08em] text-white lg:tracking-[0.1em]">
                    {product.name}
                  </h1>

                  <div className="flex flex-col gap-2">
                    <p className="text-[clamp(1.125rem,1.5vw,1.25rem)] font-medium tracking-[0.1em] text-white">
                      {qar(product.price)}
                    </p>
                    <StarRating
                      rating={product.rating}
                      starClassName="lg:h-6 lg:w-6"
                      textClassName="text-[14px] sm:text-[16px]"
                    />
                  </div>

                  {product.description && (
                    <p className="text-[clamp(0.8125rem,1.1vw,0.9375rem)] leading-relaxed tracking-[0.04em] text-white/50">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Colour */}
                {product.colors?.length > 0 && (
                  <section className="flex flex-col gap-5 lg:gap-[26px]">
                    <SectionLabel>CHOOSE COLOR</SectionLabel>
                    <div className="flex flex-wrap items-center gap-[18px]">
                      {product.colors.map((c) => (
                        <ColorSwatch
                          key={c.name}
                          hex={c.hex}
                          name={c.name}
                          selected={c.name === colorName}
                          onSelect={() => setColorName(c.name)}
                          className="h-9 w-9 ring-offset-black lg:h-10 lg:w-10"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Gifts — heading and all, only when there is something to pick from. */}
                {showGifts && (
                <section className="flex flex-col gap-5 lg:gap-[26px]">
                  <SectionLabel>ADD A GIFT</SectionLabel>
                  {/*
                    When the admin has assigned a gift group to this product's category, that
                    group IS this section — it is the only thing shown, so what the customer
                    picks from is exactly what was configured in the admin panel.

                    The catalogue tiles below remain as the fallback for a category with no
                    gift group yet, so products that were never given one keep working.
                  */}
                  {giftGroups.length ? (
                    <GiftSection groups={giftGroups} selected={addOns} onChange={setAddOns} theme="blushing" />
                  ) : gifts.loading ? (
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-[24px] sm:h-[106px]" />)}
                    </div>
                  ) : gifts.error ? (
                    <LoadError message={gifts.error} onRetry={gifts.reload} />
                  ) : (
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                      {(gifts.data ?? []).map((g) => {
                        const on = addOns.some((a) => a.id === g.id);
                        const art = giftArt(g.name, g.image);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggleGift(g)}
                            suppressHydrationWarning
                            className="flex items-center gap-1.5 rounded-[24px] border px-2 py-2.5 text-left transition-colors sm:gap-2 sm:py-3"
                            style={{
                              borderColor: on ? GOLD : CARD_BORDER,
                              backgroundColor: on ? TILE_BG_ON : 'transparent',
                            }}
                          >
                            <span className="flex min-w-0 flex-1 flex-col gap-1 pl-1">
                              <span className="text-[12px] leading-tight tracking-[0.04em] text-white/70 sm:text-[clamp(0.8125rem,0.7647rem_+_0.1961vw,1rem)]">{g.name}</span>
                              {/* QAR strings are longer than the mock's "₹ 45" and would wrap. */}
                              <span className="whitespace-nowrap text-[13px] font-medium tracking-[0.04em] text-white/30 sm:text-[clamp(0.9375rem,0.8897rem_+_0.1961vw,1.125rem)]">
                                {qar(g.price)}
                              </span>
                            </span>
                            <span className="relative h-11 w-11 shrink-0 sm:h-[clamp(3.5rem,3.02rem_+_1.96vw,5rem)] sm:w-[clamp(3.5rem,3.02rem_+_1.96vw,5rem)]">
                              {art ? (
                                <LuxuryImage src={art} alt="" fill sizes="80px" className="object-contain" />
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
                )}

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
                        <button aria-label="Previous image" type="button" onClick={() => nudge(-1)} tabIndex={-1} className="text-white/60 transition-colors hover:text-white">
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
                        <button aria-label="Next image" type="button" onClick={() => nudge(1)} tabIndex={-1} className="text-white/60 transition-colors hover:text-white">
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
                    // Same grid and 4:3 tiles the loaded cards use, so the section does
                    // not reflow when they arrive.
                    <div className="grid grid-cols-2 gap-x-[18px] gap-y-3 sm:grid-cols-3 sm:gap-[18px] lg:grid-cols-4">
                      {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-[24px]" />)}
                    </div>
                  ) : cards.error ? (
                    <LoadError message={cards.error} onRetry={cards.reload} />
                  ) : (
                    <>
                      {/*
                        Four equal cards to a row, as the reference lays them out — a fixed grid
                        rather than the wrapping flex row this used to be, so every tile is the
                        same size instead of NO CARD carrying its own width and height while the
                        rest sized to their labels.

                        `aspect-[4/3]` is the reference's card proportion (255x190). Sizing by
                        ratio rather than a fixed height is what lets four of them sit in a
                        682px column: they scale down together and keep the shape.

                        2 -> 3 -> 4 columns, because four landscape cards across a phone would
                        leave each one too narrow to hold its label.

                        The phone grid spans the full details column, the same as the gift grid
                        above it and the delivery rail below — it was briefly capped at 310px
                        and centred to shrink the tiles, which did make them smaller but left
                        this one section visibly inset from every other block on the page. Width
                        comes from the column; the 18px gutter is the design's own value, so
                        the tile lands on its drawn proportion rather than a derived one.

                        The row gap stays tighter than the gutter on a phone (12px against
                        18px). Four rows of cards is the tallest thing in this column, and the
                        cards read as a grid either way, so the vertical rhythm is where the
                        height can be taken back without touching the card itself.
                      */}
                      <div className="grid grid-cols-2 gap-x-[18px] gap-y-3 sm:grid-cols-3 sm:gap-[18px] lg:grid-cols-4">
                        <button
                          type="button"
                          onClick={() => setTemplateId(null)}
                          aria-pressed={!templateId}
                          suppressHydrationWarning
                          className="flex aspect-[4/3] items-center justify-center break-words rounded-[24px] border px-2 text-center font-serif text-[13px] font-medium leading-tight tracking-[0.02em] text-white/70 transition-colors"
                          style={{
                            // TILE_BORDER, not HAIRLINE: NO CARD is one of the greeting tiles
                            // and the reference draws it identically to its siblings.
                            borderColor: !templateId ? GOLD : TILE_BORDER,
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
                              className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-[24px] border px-2 text-center transition-colors lg:gap-4"
                              style={{ borderColor: on ? GOLD : TILE_BORDER, backgroundColor: on ? TILE_BG_ON : TILE_BG }}
                            >
                              <Icon size={24} className="shrink-0" style={{ color: GOLD }} />
                              {/*
                                `w-full` and `break-words` are the fix, and both are needed.
                                Centred in a flex column the span sized to max-content, so a
                                long label ran past the padded box instead of wrapping inside
                                it; and CONGRATULATIONS is a single 15-character word, which
                                `word-break: normal` will not break at all — so even with a
                                width it would still have overflowed.

                                The size is set so every real label ("CONGRATULATIONS" is the
                                longest) fits on one line in the narrowest card, which is the
                                lg one: four columns in a 682px column is 157px wide, narrower
                                than the two-up phone layout. `break-words` then guarantees
                                containment for any name an admin adds later.

                                On a 390px phone the tile is 162px wide, giving 146px of text
                                against the 130px that label measures — one line, with room.
                                Below about 360px it wraps to two, which is what `break-words`
                                is there to contain.
                              */}
                              <span className="w-full break-words font-serif text-[13px] font-medium uppercase leading-tight tracking-[0.02em] text-white/70">
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
                  {/*
                    The golden panel from the reference: a 135deg wash from #3e301f to #6b5031,
                    both sampled off the Figma render's corners. Its inner rules go to a light
                    translucent white rather than the gold hairline used elsewhere — on this
                    lit surface a gold rule disappears completely.
                  */}
                  <div
                    className="overflow-hidden rounded-[24px] border"
                    style={{ background: PRICE_GRADIENT, borderColor: 'rgba(204,150,90,0.35)' }}
                  >
                    <div className="flex items-center justify-between border-b px-5 py-5 lg:px-5 lg:py-6" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                      <span className="text-[15px] tracking-[0.04em] text-white/70 lg:text-[20px]">Base Price</span>
                      <span className="text-[15px] tracking-[0.04em] text-white/70 lg:text-[20px]">{qar(product.price)}</span>
                    </div>
                    {addOns.map((a) => (
                      <div key={a.id} className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                        <span className="text-[14px] tracking-[0.04em] text-white/50 lg:text-[16px]">{a.name}</span>
                        <span className="text-[14px] tracking-[0.04em] text-white/50 lg:text-[16px]">{qar(a.price)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-5 py-5 lg:px-5 lg:py-6">
                      <span className="text-[16px] font-medium tracking-[0.04em] text-white lg:text-[20px]">Subtotal</span>
                      <span className="text-[16px] font-medium tracking-[0.04em] text-white lg:text-[20px]">{qar(pricing.subtotal)}</span>
                    </div>
                  </div>

                  <GoldButton
                    onClick={handleAddToCart}
                    disabled={!available}
                    className="h-12 w-full rounded-[24px] text-[13px] disabled:cursor-not-allowed disabled:opacity-40 lg:h-10"
                  >
                    Add to Cart
                  </GoldButton>
                  {!available && <ProductUnavailableNotice className="text-white/70" />}
                </section>
              </div>
            </div>
          </div>
    </div>
  );
}
