'use client';

import Image from 'next/image';
import type { StoreGiftGroup } from '@/lib/gifts';
import type { AddOn } from '@/hooks/useProductOptions';
import { CARD_BORDER, GOLD, TILE_BG_ON } from '@/components/client/blushing-blooms/ui';
import { formatNumber } from '@/lib/utils';

/**
 * Category-driven optional gifts on a product page.
 *
 * The groups are resolved on the server from the product's category, so this component makes
 * no request of its own and renders nothing at all when the category has no active group with
 * active gifts — never an empty section.
 *
 * Selection is shared with the existing add-ons state (`selectedAddOns`), which is what already
 * travels into the cart line. A gift is therefore an additional optional item on the line,
 * exactly like an add-on, and never replaces the product. Prices shown here are the catalog
 * prices; the server re-reads them from the Gift table when the cart is priced.
 *
 * One card model, two skins — the tile is laid out exactly like the Blushing Blooms ADD A GIFT
 * tile (name and price on the left, artwork on the right), so both product pages read as the
 * same product. `theme` only swaps colours:
 *   - 'cream'    the standard storefront palette (unchanged brand colours)
 *   - 'blushing' the dark Blushing Blooms palette, taken from its own shared constants
 */

type GiftTheme = 'cream' | 'blushing';

/** Matches the Blushing page's formatting: "QAR 45.00". */
const qar = (n: number) =>
  `QAR ${formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SKIN: Record<
  GiftTheme,
  {
    name: string;
    price: string;
    image: string;
    border: (on: boolean) => string;
    background: (on: boolean) => string;
  }
> = {
  cream: {
    /*
     * A fixed type scale, not the Blushing page's fluid clamps. This section sits in the
     * product page's narrow buying column (~174px per tile), where a price growing to 18px
     * needed more width than the tile could give and slid under the artwork.
     */
    name: 'text-[13px] leading-tight text-primary',
    price: 'text-[13px] text-[#8A8A8A]',
    /*
     * A share of the tile, not a fixed size: in this narrow buying column a fixed 80px
     * artwork left the price only 71px of the 174px tile, so it slid underneath. At 30% the
     * name and price always keep the remaining ~70%, at any column width.
     */
    image: 'aspect-square w-[30%] min-w-11 max-w-20',
    // The storefront's existing tile colours — the same ones AddOnsSelector already uses.
    border: (on) => (on ? 'var(--color-primary)' : '#E4DED4'),
    background: (on) => (on ? 'rgba(97,0,11,0.05)' : 'transparent'),
  },
  blushing: {
    // The wider Blushing column can afford the design's fluid type.
    name: 'text-[12px] leading-tight text-white/70 sm:text-[clamp(0.8125rem,0.7647rem_+_0.1961vw,1rem)]',
    price: 'text-[13px] text-white/30 sm:text-[clamp(0.9375rem,0.8897rem_+_0.1961vw,1.125rem)]',
    // The page's own tile artwork size, so these sit beside its existing gift tiles unchanged.
    image: 'h-11 w-11 sm:h-[clamp(3.5rem,3.02rem_+_1.96vw,5rem)] sm:w-[clamp(3.5rem,3.02rem_+_1.96vw,5rem)]',
    border: (on) => (on ? GOLD : CARD_BORDER),
    background: (on) => (on ? TILE_BG_ON : 'transparent'),
  },
};

export default function GiftSection({
  groups,
  selected,
  onChange,
  theme = 'cream',
}: {
  groups: StoreGiftGroup[];
  selected: AddOn[];
  onChange: (next: AddOn[]) => void;
  theme?: GiftTheme;
}) {
  if (!groups.length) return null;

  const skin = SKIN[theme];
  const isSelected = (id: string) => selected.some((s) => s.id === id);

  const toggle = (gift: StoreGiftGroup['gifts'][number]) => {
    onChange(
      isSelected(gift.id)
        ? selected.filter((s) => s.id !== gift.id)
        : [
            ...selected,
            { id: gift.id, name: gift.name, price: gift.price, image: gift.image, description: null },
          ]
    );
  };

  return (
    <>
      {groups.map((group) => (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3" key={group.id}>
          {group.gifts.map((gift) => {
            const on = isSelected(gift.id);
            return (
              <button
                key={gift.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-label={`${gift.name}, ${qar(gift.price)}`}
                onClick={() => toggle(gift)}
                suppressHydrationWarning
                className="flex items-center gap-1.5 rounded-[24px] border px-2 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:gap-2 sm:py-3"
                style={{ borderColor: skin.border(on), backgroundColor: skin.background(on) }}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1 pl-1">
                  <span className={`tracking-[0.04em] ${skin.name}`}>{gift.name}</span>
                  {/* A QAR amount is longer than the mock's "45" and must never wrap or clip. */}
                  <span className={`whitespace-nowrap font-medium tracking-[0.04em] ${skin.price}`}>
                    {qar(gift.price)}
                  </span>
                </span>
                <span className={`relative shrink-0 ${skin.image}`}>
                  <Image
                    src={gift.image}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}
