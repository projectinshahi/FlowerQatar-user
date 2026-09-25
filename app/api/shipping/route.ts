import { NextResponse } from 'next/server';
import { getShippingQuoteConfig } from '@/lib/services/cart';

/**
 * Public delivery-charge rules, so the checkout can price the order the same way the server
 * will when it places it.
 *
 * Public on purpose and safe to be: these are the fees a shopper is quoted before paying. The
 * checkout previously hardcoded `subtotal >= 150 ? 0 : 15`, so switching delivery off in the
 * admin left customers still being shown — and charged — a fee.
 *
 * Cached behind the delivery-config tag rather than read per request. The admin's save purges
 * that tag and pushes 'delivery.updated' over Socket.IO, which both the cart and the checkout
 * already listen for and re-read on — so the toggle still takes effect immediately, without
 * every visit to those two pages paying a 1.45s round trip to a database in another region.
 */
export async function GET() {
  // The underlying read falls back to NO_SHIPPING and logs on a database failure, so a blip
  // shows free delivery rather than breaking the checkout. The order is priced server-side from
  // the uncached read of the same row, so the two cannot disagree about what is billed.
  const config = await getShippingQuoteConfig();
  return NextResponse.json({ success: true, data: config });
}
