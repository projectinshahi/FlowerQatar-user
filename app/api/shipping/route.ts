import { NextResponse } from 'next/server';
import { loadShippingConfig } from '@/lib/services/cart';

/**
 * Public delivery-charge rules, so the checkout can price the order the same way the server
 * will when it places it.
 *
 * Public on purpose and safe to be: these are the fees a shopper is quoted before paying. The
 * checkout previously hardcoded `subtotal >= 150 ? 0 : 15`, so switching delivery off in the
 * admin left customers still being shown — and charged — a fee.
 *
 * Never cached: the point of the admin toggle is that it takes effect immediately.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  // loadShippingConfig already falls back to NO_SHIPPING and logs on a database failure, so a
  // blip shows free delivery rather than breaking the checkout. The order is priced server-side
  // from the same function, so the two cannot disagree.
  const config = await loadShippingConfig();
  return NextResponse.json({ success: true, data: config });
}
