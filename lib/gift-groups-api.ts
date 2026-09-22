import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { isDbUnreachable, logDbError } from '@/lib/prisma-error';
import { publishChange } from '@/lib/live-sync';
import type { LiveEventType } from '@/lib/live-events';

/**
 * Shared helpers for the gift-group admin routes.
 *
 * These live in lib/ rather than being exported from route.ts: a route file may only export
 * HTTP verbs and route config, so anything shared between sibling routes belongs here.
 */

/**
 * Gift sections are rendered by the product pages, so they re-render after every change and
 * open product pages refresh live. The invalidation itself lives in lib/live-sync.ts, which
 * uses the '/(client)/product/[slug]' pattern (the route group is required).
 *
 * `ids` are gift-group or gift ids; customers only need to know that gifts changed.
 */
export function revalidateStorefront(type: Extract<LiveEventType, `gift.${string}`>, ids: string[]) {
  publishChange({ type, ids });
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
