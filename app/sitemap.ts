import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getStoreProducts } from "@/lib/store-products";
import { prisma } from "@/lib/prisma";
import { logDbError } from "@/lib/prisma-error";

// Regenerate hourly so newly published products appear without a redeploy.
export const revalidate = 3600;

/**
 * `/search` is deliberately absent: it is noindex (see app/(client)/search/page.tsx), and
 * listing a noindex URL in a sitemap is a direct contradiction that Search Console reports as
 * an error. Cart, checkout, account and wishlist are excluded for the same reason.
 */
const STATIC_PATHS = [
  "",
  "/shop",
  "/collections",
  "/custom",
  "/about",
  "/contact",
  "/faq",
  "/care",
  "/shipping-returns",
  "/boutiques",
  "/press",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));

  let products: MetadataRoute.Sitemap = [];
  try {
    const items = await getStoreProducts();
    products = items
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${SITE_URL}/product/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch (e) {
    // DB unavailable at build/request time — still serve the static routes.
    logDbError("sitemap.products", e);
  }

  /*
   * Occasion pages are real, indexable landing pages with their own copy and product lists.
   * They were missing entirely, so nothing linked them to a crawler except the home page —
   * one internal link away from being orphaned if the featured collection changes.
   */
  let occasions: MetadataRoute.Sitemap = [];
  try {
    const rows = await prisma.occasion.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    occasions = rows.map((o) => ({
      url: `${SITE_URL}/occasion/${o.slug}`,
      lastModified: o.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (e) {
    logDbError("sitemap.occasions", e);
  }

  return [...staticRoutes, ...products, ...occasions];
}
