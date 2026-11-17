/**
 * The session cookie: one definition of its name and attributes, shared by every route that
 * issues or clears it (login, the Google callback, logout, account deletion).
 *
 * `secure` is deliberately NOT `NODE_ENV === 'production'`. That is what broke the admin login
 * on the Hostinger VPS: server.mjs forces NODE_ENV=production whenever it is started with
 * --production, which ecosystem.config.cjs always does, so the cookie went out marked `Secure`
 * while the site was served over plain http://<ip>:3000. Browsers silently discard a `Secure`
 * cookie that arrives over HTTP (RFC 6265bis 5.5) — no error anywhere. /api/auth/login
 * therefore answered 200 with a perfectly valid session that the browser threw away, and the
 * next request to /admin/dashboard carried no cookie, so proxy.ts bounced it to /admin/login.
 *
 * It now follows the scheme the site is actually served on, so putting the app behind TLS and
 * setting NEXT_PUBLIC_SITE_URL=https://… turns `Secure` on by itself. COOKIE_SECURE overrides
 * that for deployments where the two schemes differ — TLS terminating at Nginx while Next
 * itself is reached over HTTP. Both are read at runtime by server code, so flipping COOKIE_SECURE
 * is a `.env` edit plus `pm2 restart lebami --update-env`, not a rebuild.
 *
 * NEXT_PUBLIC_SITE_URL is read here directly rather than through lib/site.ts, whose SITE_URL
 * falls back to an https:// Vercel address when the variable is unset. Deriving `Secure` from
 * that fallback would silently re-create this bug on any server missing the variable.
 */
// Separate cookies for admin and customer — never reuse for the other system
export const ADMIN_SESSION_COOKIE = 'lebami_admin_session';
export const CUSTOMER_SESSION_COOKIE = 'lebami_customer_session';

// Legacy fallback (deprecated, removed after migration)
export const SESSION_COOKIE = 'session';

/** Pure so the matrix of deployments can be tested without reloading this module. */
export function resolveCookieSecure(env: {
  COOKIE_SECURE?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}): boolean {
  if (env.COOKIE_SECURE !== undefined) return env.COOKIE_SECURE === 'true';
  return (env.NEXT_PUBLIC_SITE_URL ?? '').trim().toLowerCase().startsWith('https://');
}

// Each variable is read as a literal property so Next can still inline NEXT_PUBLIC_SITE_URL.
export const COOKIE_SECURE = resolveCookieSecure({
  COOKIE_SECURE: process.env.COOKIE_SECURE,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

/*
 * Say so loudly rather than quietly shipping a downgrade. An HTTPS deployment that reaches
 * here is sending its session cookie without `Secure`, which lets a single plain-HTTP request
 * to the domain expose it.
 */
if (!COOKIE_SECURE && process.env.NODE_ENV === 'production') {
  console.warn(
    '[auth] Session cookies are NOT marked Secure, because NEXT_PUBLIC_SITE_URL is not an ' +
      'https:// address and COOKIE_SECURE is unset. Correct for a plain-HTTP deployment. ' +
      'Serve the site over HTTPS and set COOKIE_SECURE=true once TLS is in front of it.'
  );
}

/** Attributes for issuing the cookie. `maxAge` matches the 7-day expiry generateToken signs. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
} as const;

/**
 * Attributes for clearing it. A Set-Cookie only replaces a cookie with the same name, domain
 * and path, so these have to match the ones it was issued with or the browser keeps the
 * original and the session stays live. `cookies().delete(name)` sends none of them, which is
 * why logout sets an expired cookie instead of deleting.
 */
export const SESSION_COOKIE_CLEARED = {
  ...SESSION_COOKIE_OPTIONS,
  maxAge: 0,
} as const;
