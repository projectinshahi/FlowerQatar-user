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
 * Production-safe DB error log that always includes the Prisma error code, so Vercel
 * function logs show the real cause (connection vs schema vs data) instead of a silent
 * generic message.
 */
export function logDbError(context: string, error: unknown): void {
  const { code, message, meta } = describePrismaError(error);
  console.error(`[db] ${context} failed${code ? ` (${code})` : ''}: ${message}`, meta ? { meta } : '');
}
