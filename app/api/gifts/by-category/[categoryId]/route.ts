import { NextResponse } from 'next/server';
import { getGiftGroupsForCategory } from '@/lib/gifts';

/**
 * GET /api/gifts/by-category/:categoryId — public gift catalog for one parent category.
 *
 * Returns only what the storefront renders: active groups, their active gifts, and for each
 * gift just id/name/price/image. No admin fields (status, order, timestamps, category links)
 * are exposed. An empty array means "render nothing", never an empty section.
 *
 * The product page resolves gifts server-side through the same helper, so this endpoint is
 * for client-side consumers; it is deliberately uncached so an admin change shows at once.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const data = await getGiftGroupsForCategory(categoryId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[api/gifts/by-category]', e);
    return NextResponse.json({ success: false, error: 'Could not load gifts' }, { status: 500 });
  }
}
