'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, Eye, EyeOff, ImageOff, Loader2, Pencil, Plus, Search, Star, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import ReviewFormModal from './ReviewFormModal';
import { MAX_RATING } from '@/lib/reviews';

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  image: string | null;
  totalReviews: number;
  publishedReviews: number;
  averageRating: number | null;
};

export type Review = {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string | null;
  content: string;
  isPublished: boolean;
  reviewedAt: string;
};

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex text-[#D4A843]" aria-label={`${value} out of ${MAX_RATING} stars`}>
      {Array.from({ length: MAX_RATING }).map((_, i) => (
        <Star key={i} size={size} strokeWidth={0} fill="currentColor" className={i < value ? '' : 'text-gray-200'} />
      ))}
    </span>
  );
}

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Asia/Qatar' }).format(new Date(iso));

/**
 * Product-first review manager.
 *
 * The list is every product; opening one loads just that product's reviews. Reviews are
 * fetched lazily per product rather than all at once — a shop with hundreds of reviews would
 * otherwise pull the lot to render a list of names.
 */
export default function ProductReviewsManager({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formFor, setFormFor] = useState<ProductRow | null>(null);
  const [editing, setEditing] = useState<Review | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  const term = search.trim().toLowerCase();
  const visible = term ? products.filter((p) => p.name.toLowerCase().includes(term)) : products;

  const loadReviews = useCallback(async (productId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?productId=${productId}&limit=100`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load reviews');
      setReviews((await res.json()).reviews ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Opening a product loads its reviews. Done in the handler, not an effect: expanding is a
   * user action, so there is no external state to synchronise with — an effect here would
   * just be a slower, harder-to-follow way to react to the same click.
   */
  const toggleProduct = (productId: string) => {
    if (openId === productId) {
      setOpenId(null);
      setReviews([]);
      return;
    }
    setOpenId(productId);
    setReviews([]);
    loadReviews(productId);
  };

  /** Reload the open product's reviews AND the server-rendered counts in the list. */
  const refresh = () => {
    if (openId) loadReviews(openId);
    router.refresh();
  };

  const togglePublished = async (review: Review) => {
    setBusyId(review.id);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !review.isPublished }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      toast.success(review.isPublished ? 'Review hidden' : 'Review published');
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/reviews/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      toast.success('Review deleted');
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            // Form-filler extensions stamp `fdprocessedid` on inputs before hydration.
            suppressHydrationWarning
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#A83A22]"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            {products.length === 0 ? 'No products yet.' : 'No products match your search.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((product) => {
            const open = openId === product.id;
            return (
              <li key={product.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {/*
                  Two sibling buttons, never nested. An "Add Review" button inside the row
                  toggle would be a button inside a button — invalid HTML, and React would
                  warn about the nesting during hydration.
                */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-4 rounded-lg text-left transition hover:opacity-80"
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      {product.image ? (
                        <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-gray-300">
                          <ImageOff className="h-4 w-4" />
                        </span>
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium text-gray-900">{product.name}</span>
                        {product.status !== 'PUBLISHED' && (
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            {product.status}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        {product.averageRating !== null ? (
                          <>
                            <Stars value={Math.round(product.averageRating)} size={11} />
                            <span className="tabular-nums">{product.averageRating.toFixed(1)}</span>
                            <span>·</span>
                          </>
                        ) : null}
                        <span>
                          {product.totalReviews === 0
                            ? 'No reviews yet'
                            : `${product.totalReviews} review${product.totalReviews === 1 ? '' : 's'}`}
                          {product.totalReviews > product.publishedReviews &&
                            ` (${product.totalReviews - product.publishedReviews} hidden)`}
                        </span>
                      </span>
                    </span>

                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setFormFor(product);
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#A83A22] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8e311d]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Review
                  </button>
                </div>

                {open && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                    {loading ? (
                      <div className="flex justify-center py-8 text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-500">
                        No reviews for this product yet. Use <span className="font-medium">Add Review</span> above.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {reviews.map((r) => (
                          <li
                            key={r.id}
                            className={`rounded-xl border border-gray-200 bg-white p-4 ${r.isPublished ? '' : 'opacity-60'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">{r.authorName}</p>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <Stars value={r.rating} />
                                  <span className="text-xs text-gray-400">{when(r.reviewedAt)}</span>
                                  {!r.isPublished && (
                                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                      Hidden
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  onClick={() => togglePublished(r)}
                                  disabled={busyId === r.id}
                                  aria-label={r.isPublished ? `Hide review by ${r.authorName}` : `Publish review by ${r.authorName}`}
                                  title={r.isPublished ? 'Hide from storefront' : 'Publish'}
                                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                                >
                                  {busyId === r.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : r.isPublished ? (
                                    <Eye className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditing(r);
                                    setFormFor(product);
                                  }}
                                  aria-label={`Edit review by ${r.authorName}`}
                                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(r)}
                                  aria-label={`Delete review by ${r.authorName}`}
                                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {r.title && <p className="mt-3 font-medium text-gray-800">{r.title}</p>}
                            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                              {r.content}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {formFor && (
        <ReviewFormModal
          initial={editing}
          product={{ id: formFor.id, name: formFor.name }}
          onClose={() => setFormFor(null)}
          onSaved={() => {
            // Open the product being reviewed so the new entry is visible immediately.
            setOpenId(formFor.id);
            setFormFor(null);
            if (openId === formFor.id) loadReviews(formFor.id);
            router.refresh();
          }}
        />
      )}

      {deleteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Delete review?</h2>
            <p className="text-sm text-gray-600">
              Delete the review by <span className="font-semibold text-gray-900">{deleteTarget.authorName}</span>?
              To take it off the site without losing it, hide it instead.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                disabled={busyId === deleteTarget.id}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === deleteTarget.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
