// Reusable SEO builders for Lebami (metadata descriptions, keywords, structured data).
// Kept framework-agnostic so pages and route handlers can share them.

import { stripHtml } from "@/lib/site";

/** Evergreen keywords every product/category page carries (brand + core intents). */
export const LEBAMI_BASE_KEYWORDS = [
  "flowers",
  "online flowers",
  "flower delivery",
  "same day flowers",
  "fresh flowers",
  "gift delivery",
  "bouquet",
  "premium flowers",
  "flower shop",
  "flower gifts",
  "luxury flowers",
  "flower arrangements",
  "birthday flowers",
  "anniversary flowers",
  "corporate gifts",
  "Lebami",
  "flower delivery Qatar",
] as const;

/**
 * Build a de-duplicated keyword list for a product/category from its own attributes
 * (name, category, subcategory, colours) plus the evergreen base set. Capped so the
 * `keywords` meta stays focused.
 */
export function buildKeywords(input: {
  name?: string | null;
  categoryLabel?: string | null;
  subcategory?: string | null;
  colors?: string[];
  extra?: string[];
}): string[] {
  const dynamic: string[] = [];
  const push = (v?: string | null) => {
    const t = (v || "").trim().toLowerCase();
    if (t) dynamic.push(t);
  };
  push(input.name);
  push(input.subcategory);
  push(input.categoryLabel);
  for (const c of input.colors || []) push(`${c} flowers`);
  for (const e of input.extra || []) push(e);
  return Array.from(new Set([...dynamic, ...LEBAMI_BASE_KEYWORDS.map((k) => k.toLowerCase())])).slice(0, 25);
}

/**
 * A meta description for a product: prefer the product's own copy when it's substantial,
 * otherwise fall back to Lebami's conversion-focused template. Always trimmed to ~160 chars.
 */
export function productMetaDescription(name: string, custom?: string | null): string {
  const clean = stripHtml(custom || "", 160);
  if (clean && clean.length >= 60) return clean;
  return `Order ${name} online from Lebami with same-day flower delivery. Fresh flowers, elegant bouquets, premium gifts, secure payment, and fast delivery.`;
}
