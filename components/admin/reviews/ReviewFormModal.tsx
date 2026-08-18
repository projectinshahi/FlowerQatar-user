'use client';

import { useState } from 'react';
import { Loader2, Package, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { MAX_RATING } from '@/lib/reviews';
import type { Review } from './ProductReviewsManager';

/** Local YYYY-MM-DD for a date input — toISOString() would shift across the timezone. */
function toDateInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ReviewFormModal({
  initial,
  product,
  onClose,
  onSaved,
}: {
  initial: Review | null;
  /** The form is always opened from a product row, so the product is fixed — no picker. */
  product: { id: string; name: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [authorName, setAuthorName] = useState(initial?.authorName ?? '');
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [reviewedAt, setReviewedAt] = useState(toDateInput(initial?.reviewedAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        initial ? `/api/admin/reviews/${initial.id}` : '/api/admin/reviews',
        {
          method: initial ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            authorName,
            rating,
            title: title || undefined,
            content,
            isPublished,
            reviewedAt: new Date(`${reviewedAt}T12:00:00`).toISOString(),
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Unable to save review');
      toast.success(initial ? 'Review updated' : 'Review added');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save review');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#A83A22]';
  const shown = hoverRating || rating;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-form-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
          <div>
            <h2 id="review-form-title" className="text-lg font-bold text-gray-900">
              {initial ? 'Edit Review' : 'Add Review'}
            </h2>
            <p className="text-xs text-gray-500">
              Reviews you enter on a customer&apos;s behalf appear on the product page.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {/* Fixed, not a picker: the form is opened from a specific product row, so there
              is no way to attach the review to the wrong item by mistake. */}
          <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/80 px-3.5 py-2.5 text-sm">
            <Package className="h-4 w-4 shrink-0 text-[#A83A22]" />
            <span className="font-medium text-gray-500">Review for:</span>
            <span className="truncate font-semibold text-gray-900">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Customer name *
              </label>
              <input
                required
                maxLength={80}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Sarah L."
                className={field}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={reviewedAt}
                onChange={(e) => setReviewedAt(e.target.value)}
                className={field}
              />
            </div>
          </div>

          {/* Clickable stars — faster and less error-prone than typing a number. */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Rating *</label>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {Array.from({ length: MAX_RATING }).map((_, i) => {
                const value = i + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                    aria-pressed={rating === value}
                    className="rounded p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      size={26}
                      strokeWidth={0}
                      fill="currentColor"
                      className={value <= shown ? 'text-[#D4A843]' : 'text-gray-200'}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm text-gray-500">{shown} / {MAX_RATING}</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Title <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Perfect gift"
              className={field}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Review text *</label>
            <textarea
              required
              rows={5}
              maxLength={4000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What the customer said…"
              className={`${field} resize-y`}
            />
            <p className="mt-1 text-xs text-gray-400">{content.length} / 4000</p>
          </div>

          <label className="flex cursor-pointer select-none items-start justify-between gap-4 rounded-2xl border border-gray-200/80 bg-stone-50/50 p-4">
            <span className="space-y-0.5">
              <span className="block text-sm font-semibold text-gray-900">Published</span>
              <span className="block text-xs text-gray-500">
                Off keeps the review saved but hidden from the product page.
              </span>
            </span>
            <span className="relative inline-flex shrink-0 items-center">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-[#A83A22] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#A83A22] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8e311d] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Add review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
