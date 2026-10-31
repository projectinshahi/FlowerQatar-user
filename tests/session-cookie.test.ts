import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  resolveCookieSecure,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_COOKIE_CLEARED,
} from "../lib/session-cookie";

/**
 * The regression these guard is the one that broke the admin login on the VPS: the session
 * cookie went out marked `Secure` because NODE_ENV was "production", while the site was served
 * over plain http://201.18.203.217:3000. The browser discarded it silently, so /api/auth/login
 * answered 200 and the very next request to /admin/dashboard arrived with no cookie at all —
 * which is the one condition proxy.ts redirects on.
 */
const HTTP_VPS = "http://201.18.203.217:3000";

describe("session cookie Secure flag", () => {
  test("a plain-HTTP deployment does not get a Secure cookie", () => {
    assert.equal(resolveCookieSecure({ NEXT_PUBLIC_SITE_URL: HTTP_VPS }), false);
  });

  test("an HTTPS deployment does", () => {
    assert.equal(resolveCookieSecure({ NEXT_PUBLIC_SITE_URL: "https://lebami.com" }), true);
  });

  test("an unset site URL does not assume HTTPS", () => {
    // lib/site.ts falls back to an https:// Vercel address. Deriving Secure from that fallback
    // would re-create this bug on any server that is missing the variable.
    assert.equal(resolveCookieSecure({}), false);
    assert.equal(resolveCookieSecure({ NEXT_PUBLIC_SITE_URL: "" }), false);
  });

  test("COOKIE_SECURE overrides the site URL in both directions", () => {
    // TLS terminating at Nginx while Next itself is reached over HTTP: the schemes differ.
    assert.equal(resolveCookieSecure({ COOKIE_SECURE: "true", NEXT_PUBLIC_SITE_URL: HTTP_VPS }), true);
    assert.equal(
      resolveCookieSecure({ COOKIE_SECURE: "false", NEXT_PUBLIC_SITE_URL: "https://lebami.com" }),
      false
    );
  });

  test("only the exact string \"true\" enables it", () => {
    for (const v of ["1", "TRUE", "yes", "", "on"]) {
      assert.equal(resolveCookieSecure({ COOKIE_SECURE: v, NEXT_PUBLIC_SITE_URL: HTTP_VPS }), false, v);
    }
  });

  test("scheme matching ignores case and stray whitespace", () => {
    assert.equal(resolveCookieSecure({ NEXT_PUBLIC_SITE_URL: " HTTPS://Lebami.com " }), true);
  });

  test("NODE_ENV cannot reach the decision at all", () => {
    // The whole point of the fix: the deployment's scheme decides, not the build mode.
    const before = process.env.NODE_ENV;
    try {
      for (const mode of ["production", "development", undefined]) {
        if (mode === undefined) delete (process.env as Record<string, unknown>).NODE_ENV;
        else (process.env as Record<string, unknown>).NODE_ENV = mode;
        assert.equal(resolveCookieSecure({ NEXT_PUBLIC_SITE_URL: HTTP_VPS }), false, String(mode));
      }
    } finally {
      (process.env as Record<string, unknown>).NODE_ENV = before;
    }
  });
});

describe("session cookie attributes", () => {
  test("the cookie is HttpOnly, Lax, site-wide and 7 days", () => {
    assert.equal(SESSION_COOKIE, "session", "proxy.ts and lib/admin-guard.ts both read this name");
    assert.equal(SESSION_COOKIE_OPTIONS.httpOnly, true, "a script-readable session is stealable by XSS");
    assert.equal(SESSION_COOKIE_OPTIONS.sameSite, "lax");
    assert.equal(SESSION_COOKIE_OPTIONS.path, "/", "anything narrower would not be sent to /admin");
    assert.equal(
      SESSION_COOKIE_OPTIONS.maxAge,
      7 * 24 * 60 * 60,
      "must match the 7-day expiry generateToken signs, or the cookie outlives the JWT"
    );
  });

  test("clearing matches the issued cookie, so the browser really replaces it", () => {
    // A Set-Cookie only replaces a cookie with the same name, domain and path. Mismatched
    // attributes leave the original in place and logout silently does nothing.
    assert.equal(SESSION_COOKIE_CLEARED.path, SESSION_COOKIE_OPTIONS.path);
    assert.equal(SESSION_COOKIE_CLEARED.secure, SESSION_COOKIE_OPTIONS.secure);
    assert.equal(SESSION_COOKIE_CLEARED.sameSite, SESSION_COOKIE_OPTIONS.sameSite);
    assert.equal(SESSION_COOKIE_CLEARED.httpOnly, SESSION_COOKIE_OPTIONS.httpOnly);
    assert.equal(SESSION_COOKIE_CLEARED.maxAge, 0, "Max-Age=0 is what expires it");
  });

  test("the live constants agree with the resolver", () => {
    assert.equal(
      SESSION_COOKIE_OPTIONS.secure,
      resolveCookieSecure({
        COOKIE_SECURE: process.env.COOKIE_SECURE,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      })
    );
  });
});
