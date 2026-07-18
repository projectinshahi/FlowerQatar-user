import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getStoreProducts } from "@/lib/store-products";

// Regenerate hourly so newly published products appear without a redeploy.
export const revalidate = 3600;

const STATIC_PATHS = [
  "",
  "/shop",
  "/collections",
  "/search",
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
  } catch {
    // DB unavailable at build/request time — still serve the static routes.
  }

  return [...staticRoutes, ...products];
}
