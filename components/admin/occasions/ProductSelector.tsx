"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, X, PackageSearch } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Shape returned by /api/admin/occasions/selectable-products. The server does the
 * variants-JSON → image/price mapping, because that mapper is server-only (Prisma).
 */
export interface SelectableProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

const API = '/api/admin/occasions/selectable-products';

interface ProductSelectorProps {
  /** Currently selected product ids (controlled by the form). */
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

const PAGE_SIZE = 8;

/**
 * Premium product picker for the Occasion form.
 *
 * Loads from /api/admin/occasions/selectable-products and derives image/price via the
 * shared `mapDbProductToStore` (price and images live in Product.variants JSON, not columns).
 * Selected products are kept in a map so chips still render for items that aren't on the
 * current page — the admin never types an id.
 */
export default function ProductSelector({ value, onChange, error }: ProductSelectorProps) {
  const [products, setProducts] = useState<SelectableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // id -> product, so chips keep their labels across pagination/search changes.
  // State (not a ref) because the chips read it during render.
  const [known, setKnown] = useState<Record<string, SelectableProduct>>({});

  const remember = useCallback((items: SelectableProduct[]) => {
    if (items.length === 0) return;
    setKnown((prev) => {
      const next = { ...prev };
      items.forEach((i) => (next[i.id] = i));
      return next;
    });
  }, []);

  const fetchProducts = useCallback(
    async (q: string, p: number) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API}?search=${encodeURIComponent(q)}&page=${p}&limit=${PAGE_SIZE}`);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        const mapped: SelectableProduct[] = data.products || [];

        setProducts(mapped);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? mapped.length);
        remember(mapped);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [remember]
  );

  // Debounced search; resets to page 1 on a new query.
  useEffect(() => {
    const t = setTimeout(() => fetchProducts(search, page), 300);
    return () => clearTimeout(t);
  }, [search, page, fetchProducts]);

  // Hydrate chip labels for ids selected before this component mounted (edit mode).
  useEffect(() => {
    const missing = value.filter((id) => !known[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}?ids=${missing.join(',')}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) remember(data.products || []);
      } catch {
        /* chip falls back to a neutral label */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, known, remember]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggle = (p: SelectableProduct) => {
    if (selectedSet.has(p.id)) {
      onChange(value.filter((id) => id !== p.id));
    } else {
      remember([p]);
      onChange([...value, p.id]);
    }
  };

  const selectAllOnPage = () => {
    remember(products);
    onChange(Array.from(new Set([...value, ...products.map((p) => p.id)])));
  };

  const clearSelection = () => onChange([]);

  const allOnPageSelected = products.length > 0 && products.every((p) => selectedSet.has(p.id));

  return (
    <div className="space-y-4">
      {/* Selected summary + chips */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-900">
            Selected Products <span className="text-gray-400">·</span>{' '}
            <span className="text-[#A83A22]">{value.length} Selected</span>
          </p>
          {value.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>

        {value.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">No products selected yet. Pick at least one below.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {value.map((id) => {
              const p = known[id];
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-3 pr-1.5 text-xs font-medium text-gray-700"
                >
                  {p?.name ?? 'Selected product'}
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((x) => x !== id))}
                    aria-label={`Remove ${p?.name ?? 'product'}`}
                    className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Search + bulk actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search products…"
            className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]"
          />
        </div>
        <button
          type="button"
          onClick={selectAllOnPage}
          disabled={isLoading || products.length === 0 || allOnPageSelected}
          className="whitespace-nowrap rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Select all on page
        </button>
      </div>

      {/* Product list */}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3" aria-hidden="true">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3 rounded" />
                  <Skeleton className="h-3 w-1/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
              <PackageSearch className="h-7 w-7 text-orange-300" />
            </div>
            <p className="font-medium text-gray-900">No products found</p>
            <p className="mt-1 text-sm text-gray-500">Try a different search term.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {products.map((p) => {
              const checked = selectedSet.has(p.id);
              return (
                <li key={p.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-4 p-3 transition-colors ${
                      checked ? 'bg-orange-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p)}
                      className="h-4 w-4 rounded border-gray-300 text-[#A83A22] focus:ring-[#A83A22]"
                    />
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="truncate text-xs text-gray-500">{p.category}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-gray-900">
                      QAR {p.price.toFixed(2)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-3 text-sm text-gray-500">
          <span>
            {isLoading ? 'Loading…' : `Page ${page} of ${totalPages} · ${total} products`}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-gray-200 px-3 py-1 transition hover:bg-white disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-gray-200 px-3 py-1 transition hover:bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
