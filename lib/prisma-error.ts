import { Prisma } from '@prisma/client';

/**
 * Extract a stable, log-friendly description from any error — surfacing the Prisma error
 * code (e.g. P1001 can't-reach-DB, P2021 table-missing, P2022 column-missing, P2025
 * record-not-found) instead of a generic message. Reference:
 * https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export function describePrismaError(error: unknown): { code?: string; message: string; meta?: unknown } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return { code: error.code, message: error.message, meta: error.meta };
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return { code: error.errorCode ?? 'INIT', message: error.message };
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return { code: 'VALIDATION', message: error.message };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: String(error) };
}

/**
 * True when the database could not be REACHED at all — as opposed to a query being wrong.
 *
 * The distinction matters for auth: a failed connection is not the same as "not signed in".
 * Treating it as the latter logs the admin out and sends them to a login page that cannot
 * work either, hiding the real problem behind a misleading message.
 *
 * P1001 can't reach server · P1002 timed out · P1017 connection closed. Initialization errors
 * (bad URL, unreachable host at startup) count too.
 */
export function isDbUnreachable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1002', 'P1017'].includes(error.code);
  }
  return false;
}

/**
 * Production-safe DB error log that always includes the Prisma error code, so Vercel
 * function logs show the real cause (connection vs schema vs data) instead of a silent
 * generic message.
 */
export function logDbError(context: string, error: unknown): void {
  const { code, message, meta } = describePrismaError(error);
  console.error(`[db] ${context} failed${code ? ` (${code})` : ''}: ${message}`, meta ? { meta } : '');
}

/**
 * Run a database call, retrying only when the database could not be REACHED.
 *
 * Serverless Postgres (Neon here) suspends after a short idle. The first query afterwards fails
 * with P1001 while the compute wakes, then succeeds — so a single cold request was surfacing as
 * "Service temporarily unavailable" to whoever happened to click first. An admin uploading an
 * image saw the upload fail for a database they never touched.
 *
 * Deliberately narrow:
 *  - only `isDbUnreachable` failures retry. A wrong query, a missing table or a constraint
 *    violation is deterministic and must surface immediately, not three times slower.
 *  - the call must be idempotent. This is for reads; a write that may have partly applied
 *    should not be replayed blindly.
 *  - bounded at ~1.2s of added latency, so a genuinely down database still fails fast rather
 *    than holding the request open until the platform kills it.
 */
export async function retryOnUnreachable<T>(
  run: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 300
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (!isDbUnreachable(error)) throw error;
      lastError = error;
      if (attempt < attempts - 1) {
        // 300ms, then 900ms — enough for a typical wake, short enough to fail fast when down.
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 3 ** attempt));
      }
    }
  }
  throw lastError;
}
