import { NextResponse } from 'next/server';
import { getWelcomePopup } from '@/lib/welcome-popup';

/**
 * Public: the welcome-popup copy for the storefront dialog. No auth required.
 * Returns `{ data: null }` when unconfigured so the client fails silently.
 * Cached at the edge for a day — the copy changes rarely and the admin PUT
 * revalidates the storefront.
 */
export async function GET() {
  const data = await getWelcomePopup();
  return NextResponse.json(
    { success: true, data },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400' } }
  );
}
