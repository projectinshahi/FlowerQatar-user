import type { Product } from '@/types';

/**
 * Shop filter derivation — pure, so the cascade can be tested without a browser or a database.
 *
 * The rule the old implementation broke: a filter option may only exist if choosing it returns
 * products. Everything here is derived from the products actually in scope, and every incoming
 * filter value is reconciled against that derivation before it is applied.
 */

export interface FacetValue {
  /** URL-safe value written to the query string. */
  value: string;
  /** What the shopper reads. */
  label: string;
  /** Products that remain if this value is chosen, given the OTHER active filters. */
  count: number;
}

export interface ShopFacets {
  subcategories: FacetValue[];
  /**
   * Country of origin. Empty whenever nothing in scope is tagged, which hides the group — so it
   * appears under Flowers, where origin is recorded, and not under categories where it is not.
   * Driven by the data rather than by a hardcoded category, so tagging a product is all it takes.
   */
  countries: FacetValue[];
  /** Null when nothing in scope has a usable price, which hides the slider entirely. */
  price: { min: number; max: number } | null;
  /** Products in scope before any child filter is applied — the "All" count. */
  total: number;
}

/**
 * Bucket for products with no subcategory assigned.
 *
 * Without it the panel does not add up: a category with 12 products but only 7 assigned shows
 * "All 12" above a list totalling 7, and the missing five are unreachable and unexplained. The
 * bucket only appears when it is non-empty, so it disappears on its own once every product has
 * been given a subcategory in the admin.
 */
export const UNASSIGNED_SUBCATEGORY = 'none';

export const SORT_OPTIONS = ['featured', 'price-low-high', 'price-high-low', 'newest'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
export const DEFAULT_SORT: SortOption = 'featured';

export interface ChildFilters {
  subcategory: string | null;
  country: string | null;
  /** Inclusive price ceiling in QAR. */
  maxPrice: number | null;
  sort: SortOption;
}

/**
 * Query-string keys owned by the filter panel. Changing a CATEGORY invalidates every one of
 * them, so the cascade reset is a single sweep over this set rather than a list of `delete`
 * calls that drifts out of date whenever a facet is added.
 */
export const CHILD_FILTER_PARAMS = [
  'subcategory',
  'collection',
  'color',
  'country',
  'maxPrice',
  'sort',
] as const;

export const EMPTY_FILTERS: ChildFilters = {
  subcategory: null,
  country: null,
  maxPrice: null,
  sort: DEFAULT_SORT,
};

/* ────────────────────────────── predicates ────────────────────────────── */

const isUnassigned = (p: Product) => !p.collection || !p.collectionName;

const matchesSubcategory = (p: Product, v: string | null) =>
  !v || (v === UNASSIGNED_SUBCATEGORY ? isUnassigned(p) : p.collection === v);
const matchesCountry = (p: Product, v: string | null) => !v || p.country === v;
const matchesPrice = (p: Product, v: number | null) =>
  v === null || (Number.isFinite(p.price) && p.price <= v);

/** Applies every child filter. `except` skips one, which is what makes facet counts useful. */
function filterProducts(
  products: Product[],
  f: ChildFilters,
  except?: 'subcategory' | 'country' | 'maxPrice'
): Product[] {
  return products.filter(
    (p) =>
      (except === 'subcategory' || matchesSubcategory(p, f.subcategory)) &&
      (except === 'country' || matchesCountry(p, f.country)) &&
      (except === 'maxPrice' || matchesPrice(p, f.maxPrice))
  );
}

export const applyFilters = (products: Product[], f: ChildFilters) => filterProducts(products, f);

/* ────────────────────────────── derivation ────────────────────────────── */

/**
 * Facets for a scope, counted against the OTHER active filters.
 *
 * Counting a facet against its own selection is the classic dead-end: pick Lilies and the list
 * collapses to "Lilies (6)", so the shopper cannot switch to Tulip without clearing first. Each
 * group therefore excludes itself from its own count.
 *
 * The returned subcategory counts always sum to `total`, because anything without a subcategory
 * lands in the Other bucket rather than vanishing from the breakdown.
 */
export function deriveFacets(scoped: Product[], f: ChildFilters = EMPTY_FILTERS): ShopFacets {
  const forSubcategories = filterProducts(scoped, f, 'subcategory');
  const forCountries = filterProducts(scoped, f, 'country');
  const forPrice = filterProducts(scoped, f, 'maxPrice');

  const subMap = new Map<string, FacetValue>();
  let unassigned = 0;
  for (const p of forSubcategories) {
    if (isUnassigned(p)) {
      unassigned += 1;
      continue;
    }
    const hit = subMap.get(p.collection);
    if (hit) hit.count += 1;
    else subMap.set(p.collection, { value: p.collection, label: p.collectionName!, count: 1 });
  }

  const subcategories = [...subMap.values()].sort((a, b) => a.label.localeCompare(b.label));
  // Always last: it is a remainder, not a peer of the real subcategories.
  if (unassigned > 0) {
    subcategories.push({ value: UNASSIGNED_SUBCATEGORY, label: 'Other', count: unassigned });
  }

  /*
   * Only TAGGED products are counted. Unlike subcategory — where every product belongs
   * somewhere, so a remainder bucket is needed for the column to add up — origin is an optional
   * attribute, and "unknown origin" is not something a shopper chooses. Untagged products are
   * simply absent from this group, and the group's "All" row deliberately shows no total so the
   * numbers never look like they should sum to the scope.
   */
  const countryMap = new Map<string, FacetValue>();
  for (const p of forCountries) {
    if (!p.country) continue;
    const hit = countryMap.get(p.country);
    if (hit) hit.count += 1;
    else countryMap.set(p.country, { value: p.country, label: p.country, count: 1 });
  }

  const prices = forPrice.map((p) => p.price).filter((n) => Number.isFinite(n) && n > 0);

  return {
    subcategories,
    countries: [...countryMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
    price: prices.length
      ? { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) }
      : null,
    total: scoped.length,
  };
}

/* ───────────────────────────── reconciliation ───────────────────────────── */

/**
 * Drops filter values that cannot exist in the current scope.
 *
 * This is what a stale shared link or a browser Back lands on: `?category=gift-combos&
 * subcategory=<a Flowers id>`. Without this the grid renders empty while the panel shows no
 * matching option to clear — the exact failure this refactor exists to remove.
 *
 * Facets must be derived with EMPTY_FILTERS here: reconciling against counts that were already
 * narrowed by the very values being reconciled would drop legitimate combinations.
 */
export function reconcileFilters(
  requested: ChildFilters,
  scoped: Product[]
): { filters: ChildFilters; dropped: string[] } {
  const open = deriveFacets(scoped, EMPTY_FILTERS);
  const dropped: string[] = [];
  const filters: ChildFilters = { ...requested };

  if (filters.subcategory && !open.subcategories.some((s) => s.value === filters.subcategory)) {
    filters.subcategory = null;
    dropped.push('subcategory');
  }

  if (filters.country && !open.countries.some((c) => c.value === filters.country)) {
    filters.country = null;
    dropped.push('country');
  }

  /*
   * Price is reconciled against the set the SUBCATEGORY already narrowed, not against the whole
   * scope. Checking each filter independently lets two individually-valid values combine into
   * nothing — "Tulip" exists and a QAR 150 cap is inside the category's 100–300 range, yet the
   * only Tulip costs 300, so the pair returns an empty grid from a link the panel could never
   * have produced. Narrowing in the same order the panel does keeps the two consistent: the
   * slider's own bounds are already computed with the subcategory applied.
   */
  if (filters.maxPrice !== null) {
    const narrowed = applyFilters(scoped, {
      ...EMPTY_FILTERS,
      subcategory: filters.subcategory,
      country: filters.country,
    });
    const bounds = deriveFacets(narrowed, EMPTY_FILTERS).price;
    // A ceiling at or above the maximum constrains nothing, so it is noise in the URL. Below
    // the minimum it would empty the grid with no way to tell why.
    if (!bounds || filters.maxPrice >= bounds.max || filters.maxPrice < bounds.min) {
      filters.maxPrice = null;
      dropped.push('maxPrice');
    }
  }
  if (!SORT_OPTIONS.includes(filters.sort)) {
    filters.sort = DEFAULT_SORT;
    dropped.push('sort');
  }

  return { filters, dropped };
}

/* ──────────────────────────────── sorting ──────────────────────────────── */

/**
 * Sorted copy. `newest` previously called `.reverse()` on an arbitrarily-ordered array, which
 * is not an ordering — it ranks flagged arrivals first and leaves the rest stable.
 */
export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const out = [...products];
  switch (sort) {
    case 'price-low-high':
      return out.sort((a, b) => a.price - b.price);
    case 'price-high-low':
      return out.sort((a, b) => b.price - a.price);
    case 'newest':
      return out.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    case 'featured':
    default:
      return out.sort((a, b) => Number(!!b.isBestSeller) - Number(!!a.isBestSeller));
  }
}

/* ───────────────────────────── param parsing ───────────────────────────── */

/** Reads child filters out of a query string, coercing junk to null rather than throwing. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): ChildFilters {
  const one = (k: string) => {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s && s.trim() ? s.trim() : null;
  };
  const rawPrice = one('maxPrice');
  const price = rawPrice === null ? null : Number(rawPrice);
  const rawSort = one('sort');

  return {
    // `collection` is the legacy alias for `subcategory`; both still arrive from old links.
    // `color` is deliberately not read — the colour facet was retired. It stays listed in
    // CHILD_FILTER_PARAMS so old links still get it swept out on the next category change.
    subcategory: one('subcategory') ?? one('collection'),
    country: one('country'),
    maxPrice: Number.isFinite(price) && (price as number) > 0 ? (price as number) : null,
    sort: SORT_OPTIONS.includes(rawSort as SortOption) ? (rawSort as SortOption) : DEFAULT_SORT,
  };
}
