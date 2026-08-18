import { NextResponse } from 'next/server';
import { z } from 'zod';
import { availabilityRequestSchema } from '@/lib/stock';
import { checkAvailability } from '@/lib/services/stock';
import { isDbUnreachable, logDbError } from '@/lib/prisma-error';

/**
 * POST /api/stock/availability — real-time availability for a batch of sellable units.
 *
 * Public: the storefront needs this before the customer signs in (product page, cart drawer),
 * and it exposes nothing beyond whether an item can be bought.
 *
 * POST rather than GET because a cart check carries a list of composite keys, which does not
 * fit a query string cleanly. Nothing is written.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = availabilityRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: issue?.message ?? 'Invalid request',
        // Path tells the client WHICH line failed — important for a batch.
        field: issue?.path.join('.') || undefined,
      },
      { status: 400 }
    );
  }

  try {
    const results = await checkAvailability(parsed.data.items);
    return NextResponse.json({
      items: results,
      /** Convenience for the checkout button: true only if every line can be fulfilled. */
      allAvailable: results.every((r) => r.canFulfil),
    });
  } catch (error) {
    if (isDbUnreachable(error)) {
      logDbError('POST /api/stock/availability', error);
      return NextResponse.json(
        { error: 'Stock service temporarily unavailable' },
        { status: 503 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    logDbError('POST /api/stock/availability', error);
    return NextResponse.json({ error: 'Could not check availability' }, { status: 500 });
  }
}
