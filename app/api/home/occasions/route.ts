import { NextResponse } from 'next/server';
import { getActiveOccasions } from '@/lib/occasions';

/**
 * Public: active occasions in display order, each with a trimmed product payload.
 *
 * The home page reads `getActiveOccasions()` directly in a Server Component (no HTTP
 * hop); this endpoint exists for client/3rd-party consumers and returns only the
 * fields a listing needs.
 *
 * `price` is always the list price and `salePrice` is the discounted one (or null) —
 * the store mapper collapses those into price/originalPrice, so we invert it here.
 */
export async function GET() {
  try {
    const occasions = await getActiveOccasions();

    return NextResponse.json({
      occasions: occasions.map((o) => ({
        id: o.id,
        title: o.title,
        slug: o.slug,
        subtitle: o.subtitle,
        bannerImage: o.bannerImage,
        products: o.products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          thumbnail: p.image,
          price: p.originalPrice ?? p.price,
          salePrice: p.originalPrice != null ? p.price : null,
          rating: p.rating,
          // The NAME, not `collection` — that is the subcategory UUID.
          category: p.collectionName ?? null,
        })),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch occasions:', error);
    return NextResponse.json({ error: 'Failed to fetch occasions' }, { status: 500 });
  }
}
