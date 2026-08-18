"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Edit2, Trash2, Plus, Search, Loader2, ImageOff, ArrowUpDown, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { isVideoMedia } from '@/lib/media';
import { toast } from 'sonner';

interface Occasion {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  bannerImage: string | null;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  productsCount: number;
  createdAt: string;
}

type SortField = 'displayOrder' | 'title' | 'createdAt';

const PAGE_SIZE = 10;
const COLS = 9;

/** Defined at module scope — declaring it inside the list would remount it every render. */
function SortHeader({
  field, label, sortBy, onSort,
}: { field: SortField; label: string; sortBy: SortField; onSort: (f: SortField) => void }) {
  return (
    <button
      onClick={() => onSort(field)}
      // Form-filler extensions stamp `fdprocessedid` onto buttons before React hydrates;
      // that attribute is not ours, so ignore the diff rather than logging a mismatch.
      suppressHydrationWarning
      className={`inline-flex items-center gap-1.5 transition-colors hover:text-gray-900 ${
        sortBy === field ? 'text-gray-900' : ''
      }`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}

export default function OccasionList() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortField>('displayOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOccasions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/occasions?search=${encodeURIComponent(search)}&page=${page}&limit=${PAGE_SIZE}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOccasions(data.occasions);
      setTotalPages(data.pagination.totalPages || 1);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to fetch occasions');
    } finally {
      setIsLoading(false);
    }
  }, [search, page, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchOccasions, 300);
    return () => clearTimeout(timer);
  }, [fetchOccasions]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const toggleStatus = async (id: string, current: boolean) => {
    // Optimistic — reverted if the request fails.
    setOccasions((prev) => prev.map((o) => (o.id === id ? { ...o, isActive: !current } : o)));
    try {
      const res = await fetch(`/api/admin/occasions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error();
      toast.success(!current ? 'Occasion enabled' : 'Occasion disabled');
    } catch {
      setOccasions((prev) => prev.map((o) => (o.id === id ? { ...o, isActive: current } : o)));
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/occasions/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Occasion deleted successfully');
        fetchOccasions();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete occasion');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search occasions..."
            // Same extension-injected attribute as the sort buttons above.
            suppressHydrationWarning
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]"
          />
        </div>
        {/*
          Only one occasion may exist, so the button is replaced by an explanation once there
          is one — offering an action the server will reject with 409 is worse than not
          offering it. Deleting the occasion brings the button back.
        */}
        {total > 0 ? (
          <p className="whitespace-nowrap rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
            One occasion at a time — edit or delete it to change the home page section.
          </p>
        ) : (
          <Link
            href="/admin/occasions/new"
            className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#A83A22] px-5 py-2.5 font-medium text-white transition hover:bg-[#8e311d]"
          >
            <Plus className="h-5 w-5" />
            Add Occasion
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="border-b border-gray-100 bg-gray-50/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="p-4">Banner</th>
                <th className="p-4"><SortHeader field="title" label="Heading" sortBy={sortBy} onSort={toggleSort} /></th>
                <th className="p-4">Sub Heading</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Products</th>
                <th className="p-4"><SortHeader field="displayOrder" label="Order" sortBy={sortBy} onSort={toggleSort} /></th>
                <th className="p-4">Status</th>
                <th className="p-4"><SortHeader field="createdAt" label="Created" sortBy={sortBy} onSort={toggleSort} /></th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                // Same row shape as before, now on the shared shimmer instead of animate-pulse.
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td className="p-4"><Skeleton className="h-12 w-16 rounded-lg" /></td>
                    <td className="p-4"><Skeleton className="h-3 w-28 rounded" /></td>
                    <td className="p-4"><Skeleton className="h-3 w-40 rounded" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16 rounded-md" /></td>
                    <td className="p-4"><Skeleton className="h-3 w-10 rounded" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-8 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-11 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-3 w-20 rounded" /></td>
                    <td className="p-4" />
                  </tr>
                ))
              ) : occasions.length === 0 ? (
                <tr>
                  <td colSpan={COLS} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50">
                        <Search className="h-10 w-10 text-orange-300" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">No Occasions Found</p>
                      <p className="mt-1 text-gray-500">
                        {search ? 'Try adjusting your search.' : 'Create your first occasion to feature products on the home page.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                occasions.map((o) => (
                  <tr key={o.id} className="group transition hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="relative flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        {/*
                          Banners can now be a video as well as a still. Feeding a video URL
                          to next/image renders a broken-image icon, so branch on the media
                          type — the same isVideoMedia rule the storefront banner uses.

                          The clip is a silent, non-autoplaying poster frame: dozens of
                          autoplaying videos in an admin table would be both noisy and heavy.
                        */}
                        {o.bannerImage ? (
                          isVideoMedia({ url: o.bannerImage }) ? (
                            <>
                              <video
                                src={o.bannerImage}
                                muted
                                playsInline
                                preload="metadata"
                                aria-label={`${o.title} banner video`}
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                                <Play className="h-3.5 w-3.5 fill-white text-white" />
                              </span>
                            </>
                          ) : (
                            <Image src={o.bannerImage} alt={o.title} fill sizes="64px" className="object-cover" />
                          )
                        ) : (
                          <ImageOff className="h-4 w-4 text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{o.title}</p>
                      <p className="text-xs text-gray-500">/{o.slug}</p>
                    </td>
                    <td className="p-4">
                      <p className="max-w-xs truncate text-sm text-gray-600" title={o.subtitle}>
                        {o.subtitle}
                      </p>
                    </td>
                    <td className="p-4">
                      {o.isFeatured ? (
                        <span className="inline-flex items-center rounded-md border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#A83A22]">
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {o.productsCount} {o.productsCount === 1 ? 'product' : 'products'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                        {o.displayOrder}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(o.id, o.isActive)}
                        aria-label={o.isActive ? 'Disable occasion' : 'Enable occasion'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#A83A22] focus:ring-offset-2 ${
                          o.isActive ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            o.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600">
                        {new Date(o.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          href={`/admin/occasions/${o.id}/edit`}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                          aria-label={`Edit ${o.title}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(o.id)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${o.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm text-gray-500">
          <span>
            {isLoading ? 'Loading…' : `Showing ${occasions.length} of ${total} occasions`}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-gray-200 px-3 py-1 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-gray-200 px-3 py-1 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
          <div className="w-full max-w-md animate-in rounded-2xl bg-white p-6 shadow-xl duration-200 zoom-in-95">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-center text-xl font-bold text-gray-900">Delete Occasion</h3>
            <p className="mb-6 text-center text-gray-500">
              This removes the occasion and its product links from the home page. Your products are not deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 font-medium text-white transition hover:bg-red-600 disabled:opacity-70"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
