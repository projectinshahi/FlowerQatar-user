import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { isDbUnreachable, logDbError } from '@/lib/prisma-error';

/**
 * Shared helpers for the gift-group admin routes.
 *
 * These live in lib/ rather than being exported from route.ts: a route file may only export
 * HTTP verbs and route config, so anything shared between sibling routes belongs here.
 */

/**
 * Gift sections are rendered by the product pages, so they re-render after every change.
 *
 * The pattern must include the `(client)` route group: the page file is
 * app/(client)/product/[slug]/page.tsx, and a route pattern is matched against the file path.
 * '/product/[slug]' matched nothing, so in production every product page kept serving its
 * cached copy (x-nextjs-cache: HIT) with the old gifts after an admin edit. Dev never caches
 * pages, which is why it only showed on the live site.
 */
export function revalidateStorefront() {
  revalidatePath('/(client)/product/[slug]', 'page');
}

/** One error shape for every gift route: validation -> 400, FK -> 404, DB down -> 503. */
export function fail(error: unknown, context: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: the row was deleted (often in another tab). P2003: a referenced row is gone.
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'That gift group or gift no longer exists' }, { status: 404 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'A selected category or gift group no longer exists' }, { status: 404 });
    }
  }
  if (isDbUnreachable(error)) {
    logDbError(context, error);
    return NextResponse.json(
      { error: 'Service temporarily unavailable — could not reach the database.' },
      { status: 503 }
    );
  }
  logDbError(context, error);
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}

/*
 * There is deliberately no "do these categories exist?" pre-check: it cost a round trip on
 * every save, and assigning a category that has since been deleted raises P2003, which the
 * handler above already reports as a 404 with a readable message.
 */
