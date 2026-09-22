import { NextResponse } from 'next/server';
import { getWelcomePopup } from '@/lib/welcome-popup';

/**
 * Public: the welcome-popup copy for the storefront dialog. No auth required.
 * Returns `{ data: null }` when unconfigured so the client fails silently.
 *
 * Not edge-cached. It used to send `s-maxage=86400`, which told any CDN to keep serving the old
 * copy for a day after an admin edit (nothing purges a CDN; revalidatePath only clears Next's
 * own cache). The dialog fetches this once per browser session, so the DB cost is small.
 */
export async function GET() {
  const data = await getWelcomePopup();
  return NextResponse.json({ success: true, data });
}
