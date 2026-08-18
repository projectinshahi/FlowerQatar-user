import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { setStockSchema } from '@/lib/stock';
import { StockError, getProductStock, setStock } from '@/lib/services/stock';
import { isDbUnreachable, logDbError } from '@/lib/prisma-error';

/** Shared failure mapping so both handlers report the same way. */
function fail(context: string, error: unknown) {
  if (error instanceof StockError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? 'Invalid input', field: issue?.path.join('.') || undefined },
      { status: 400 }
    );
  }
  if (isDbUnreachable(error)) {
    logDbError(context, error);
    return NextResponse.json({ error: 'Stock service temporarily unavailable' }, { status: 503 });
  }
  logDbError(context, error);
  return NextResponse.json({ error: 'Stock operation failed' }, { status: 500 });
}

const productIdSchema = z.string().uuid('Must be a valid product id');

/** GET /api/admin/stock?productId=… — every stock row for one product. */
export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  try {
    const productId = new URL(request.url).searchParams.get('productId');
    const parsed = productIdSchema.safeParse(productId);
    if (!parsed.success) {
      return NextResponse.json({ error: 'A valid productId is required' }, { status: 400 });
    }
    return NextResponse.json({ stock: await getProductStock(parsed.data) });
  } catch (error) {
    return fail('GET /api/admin/stock', error);
  }
}

/**
 * PUT /api/admin/stock — set the absolute count for one sellable unit.
 *
 * PUT, not PATCH: the body carries the authoritative figure rather than a delta, so repeating
 * the same request is idempotent. `reserved` is never altered here — it belongs to in-flight
 * orders, not to the admin's shelf count.
 */
export async function PUT(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const data = setStockSchema.parse(body);
    const level = await setStock(data);
    return NextResponse.json({
      stock: level,
      available: Math.max(0, level.quantity - level.reserved),
    });
  } catch (error) {
    return fail('PUT /api/admin/stock', error);
  }
}
