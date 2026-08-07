import type { NextConfig } from "next";

// Intended Content-Security-Policy. Shipped in Report-Only mode so it can never break
// the live site; promote to "Content-Security-Policy" after reviewing violation reports.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://accounts.google.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://flagcdn.com https://images.unsplash.com https://upload.wikimedia.org https://*.googleusercontent.com https://www.google-analytics.com https://*.google-analytics.com",
  "media-src 'self' https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.cloudinary.com https://flagcdn.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com",
  "frame-src https://www.youtube.com https://accounts.google.com",
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
    cpus: 1,
  },

  compress: true,
  poweredByHeader: false,

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

export default nextConfig;
