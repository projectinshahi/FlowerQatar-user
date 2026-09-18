import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private / transactional areas out of the index.
      // /search is additionally noindex at the page level; disallowing it here saves
      // crawl budget on an unbounded set of near-duplicate result URLs.
      // /orders, /verify and /membership are per-customer invoices and payment steps.
      disallow: ["/admin", "/api", "/account", "/checkout", "/cart", "/wishlist", "/search", "/orders", "/verify", "/membership"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
