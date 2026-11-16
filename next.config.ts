import type { NextConfig } from "next";
import { cpus } from "os";
import { CATEGORY_ORDER, CATEGORY_META, categorySlug } from "./lib/category-config";

const cpuCount = cpus().length || 1;

// Intended Content-Security-Policy. Shipped in Report-Only mode so it can never break
// the live site; promote to "Content-Security-Policy" after reviewing violation reports.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://flagcdn.com https://images.unsplash.com https://upload.wikimedia.org https://*.googleusercontent.com https://www.google-analytics.com https://*.google-analytics.com",
  "media-src 'self' https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.cloudinary.com https://flagcdn.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com",
  "frame-src https://accounts.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Faster, smaller images across the whole site.
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // cache optimized images for 30 days
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // OAuth profile avatars (e.g. Google sign-in) served from *.googleusercontent.com
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },

  // Trim the client bundle so pages hydrate/interact more smoothly.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    /*
     * Build workers for page-data collection and static generation.
     *
     * This was pinned to 1, which made the 129 prerendered pages generate strictly one after
     * another. Their cost is mostly waiting on the remote database, not CPU, so the worker sat
     * idle: measured here, static generation was 39.2s on one worker and 16.3s on four.
     *
     * Capped rather than unlimited. Letting Next use all 12 cores took static generation to
     * 10.8s but slowed compilation and type checking by ~12s between them (each worker is a
     * whole Node process, and this box has 8GB), so the build as a whole was slower. Four is
     * the measured sweet spot, and `min` keeps a smaller build machine from being oversubscribed
     * — on a single-core deploy box this is still 1, exactly as before.
     */
    cpus: Math.min(4, cpuCount),
  },

  compress: true,
  poweredByHeader: false,

  /*
   * Old category URLs (/flowers, /gift-combos, ...) to the /shop listing, as a real HTTP 308.
   * app/(client)/[category] also redirects, but a redirect() inside a streamed page reaches the
   * client as a 200 with a meta refresh, so search engines never saw a permanent move. The
   * incoming query (e.g. ?tab=) is carried over automatically.
   *
   * /blushing-blooms is left out: it is now its own Coming Soon page (app/(client)/blushing-blooms),
   * and a redirect would run before it. The Blushing Blooms shop stays at /shop?category=blushing-blooms.
   */
  async redirects() {
    return CATEGORY_ORDER.filter((c) => c !== 'BLUSHING_BLOOMS').map((c) => ({
      source: CATEGORY_META[c].base,
      destination: `/shop?category=${categorySlug(c)}`,
      permanent: true,
    }));
  },

  // Security headers applied to every route. HSTS is prod-only so localhost/http is unaffected.
  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      { key: "Content-Security-Policy-Report-Only", value: CSP },
    ];
    if (process.env.NODE_ENV === "production") {
      headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
    }
    return [{ source: "/:path*", headers }];
  },
};

/*
 * NEXT_PUBLIC_SITE_URL is baked into the bundle at build time, and lib/site.ts falls back to a
 * Vercel address when it is unset. That fallback is silent, and it is load-bearing in places
 * that cost money or lock people out:
 *
 *   lib/services/skipcash.ts   webhookUrl + returnUrl handed to the payment gateway - a wrong
 *                              value means SkipCash posts the "payment succeeded" callback to
 *                              another domain and orders are never marked paid.
 *   app/api/auth/google/*      the OAuth redirect_uri, which Google matches exactly.
 *   app/sitemap.ts, robots.ts, canonicals, invoice verification links.
 *
 * So a production build without it is refused here rather than shipped. Checked only during
 * `next build`: the running server must never fail to start over this, and `next dev` is
 * deliberately unaffected.
 */
if (process.env.NEXT_PHASE === "phase-production-build") {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set. It is inlined at build time and is used for the SkipCash " +
        "webhook/return URLs, the Google OAuth redirect_uri, sitemap and canonicals. Set it to the " +
        "public origin (e.g. https://your-domain.com) before building."
    );
  }
  if (!/^https?:\/\//i.test(siteUrl)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an absolute URL including the scheme; received "${siteUrl}".`
    );
  }
}

export default nextConfig;
