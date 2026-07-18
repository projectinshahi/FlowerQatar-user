import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/admin-guard';
import { getProducts } from '@/lib/actions/product.actions';
import { mapDbProductToStore } from '@/lib/store-products';

/**
 * Products shaped for the Occasion product picker.
 *
 * Exists because image/price are derived from Product.variants JSON via
 * `mapDbProductToStore` — a server-only module (it pulls in Prisma), so the picker
 * cannot map raw rows itself. Reuses the existing `getProducts` service rather than
 * re-querying, and leaves the existing /api/admin/products contract untouched.
 */
export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '8') || 8));
    const ids = searchParams.get('ids')?.split(',').filter(Boolean);

    // `ids` mode: resolve chip labels for an occasion's existing selection.
    if (ids?.length) {
      const result = await getProducts({ page: 1, limit: 100 });
      if (!result.success || !result.data) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
      }
      const wanted = new Set(ids);
      const products = result.data.products
        .filter((p) => wanted.has(p.id))
        .map((p) => toOption(p));
      return NextResponse.json({ products, pagination: { total: products.length, page: 1, limit, totalPages: 1 } });
    }

    const result = await getProducts({ search, page, limit });
    if (!result.success || !result.data) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      products: result.data.products.map((p) => toOption(p)),
      pagination: result.data.pagination,
    });
  } catch (error) {
    console.error('Failed to fetch selectable products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

type RawProduct = Parameters<typeof mapDbProductToStore>[0] & { category?: { name?: string } | null };

function toOption(raw: RawProduct) {
  const store = mapDbProductToStore(raw);
  return {
    id: store.id,
    name: store.name,
    image: store.image,
    price: store.price,
    category: raw.category?.name || '—',
  };
}
