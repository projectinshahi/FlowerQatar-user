// Central site constants for SEO (metadata, sitemap, robots, structured data).
// Set NEXT_PUBLIC_SITE_URL in .env to your production domain.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://flower-qatar-user.vercel.app/").replace(/\/+$/, "");
export const SITE_NAME = "Lebami";
export const SITE_DESCRIPTION =
  "Experience the original Eternity® Roses — handcrafted luxury arrangements of real roses that last a year.";

/** Resolve a path to an absolute URL (passes through URLs that are already absolute). */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Strip HTML tags + collapse whitespace, for meta descriptions built from rich text. */
export function stripHtml(html: string, max = 160): string {
  const text = (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
