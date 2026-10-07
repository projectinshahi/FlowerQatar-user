import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const SECRET: string = JWT_SECRET || 'insecure-dev-only-secret-do-not-use-in-prod';

if (!JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('[auth] JWT_SECRET is not set — using an insecure development fallback. Set JWT_SECRET in .env.');
}

const MISSING_PROD_SECRET = !JWT_SECRET && process.env.NODE_ENV === 'production';

/** Fail closed: never sign real sessions with the insecure fallback in production. */
function assertSecret() {
  if (MISSING_PROD_SECRET) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
}

export interface JWTPayload {
  userId: string;
  role: string;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  // Cost factor 12 (modern baseline). Existing 10-cost hashes still verify fine.
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password with a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JWTPayload, expiresIn = '7d'): string {
  assertSecret();
  return jwt.sign(payload, SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  // The fallback secret is public, so a token "signed" with it proves nothing.
  if (MISSING_PROD_SECRET) return null;
  try {
    return jwt.verify(token, SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Short-lived, single-purpose signed token (e.g. proof that an email OTP was
 * verified during registration). Not a session — used to bridge multi-step flows.
 */
export function signScopedToken(payload: Record<string, unknown>, expiresIn = "15m"): string {
  assertSecret();
  return jwt.sign(payload, SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyScopedToken<T = Record<string, unknown>>(token: string): T | null {
  if (MISSING_PROD_SECRET) return null;
  try {
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}
