'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gift as GiftIcon, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminTableCardSkeleton } from '@/components/skeletons/AdminSkeletons';
import { fixedCategoryLabel } from '@/lib/category-config';
import GiftGroupFormModal from './GiftGroupFormModal';

export interface GiftGroupRow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  categories: { category: { id: string; name: string } }[];
  _count: { categories: number; gifts: number };
}

type StatusFilter = 'all' | 'active' | 'inactive';

/** One page of rows. The API caps at 100; 20 keeps the payload small as groups grow. */
const PAGE_SIZE = 20;

export default function GiftGroupManager() {
  const [items, setItems] = useState<GiftGroupRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  // null = closed, 'new' = create, otherwise the id being edited.
  const [formFor, setFormFor] = useState<string | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GiftGroupRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status,
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy: 'displayOrder',
        sortOrder: 'asc',
      });
      const res = await fetch(`/api/admin/gift-groups?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.giftGroups || []);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      toast.error('Failed to load gift groups');
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const t = window.setTimeout(load, 300);
    return () => window.clearTimeout(t);
  }, [load]);

  /** Filters describe a new result set, so they always restart at the first page. */
  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const changeStatus = (value: StatusFilter) => {
    setStatus(value);
    setPage(1);
  };

  /** Optimistic status flip; reverts if the server refuses. */
  const toggleActive = async (row: GiftGroupRow) => {
    const next = !row.isActive;
    setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: next } : r)));
    try {
      const res = await fetch(`/api/admin/gift-groups/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      toast.success(next ? 'Gift group activated' : 'Gift group deactivated');
    } catch (e) {
      setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: row.isActive } : r)));
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/gift-groups/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      toast.success('Gift group deleted');
      setDeleteTarget(null);
      // Stepping back off a page that just lost its only row avoids an empty screen.
      if (items.length === 1 && page > 1) setPage((n) => n - 1);
      else await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const categoryNames = (row: GiftGroupRow) =>
    row.categories.map((c) => fixedCategoryLabel(c.category.name)).join(', ') || '-';

  const StatusButton = ({ row }: { row: GiftGroupRow }) => (
    <button
      onClick={() => toggleActive(row)}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
        row.isActive
          ? 'bg-green-50 text-green-700 hover:bg-green-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      aria-label={`${row.name} is ${row.isActive ? 'active' : 'inactive'}. Activate or deactivate.`}
      title="Click to change status"
      suppressHydrationWarning
    >
      {row.isActive ? 'Active' : 'Inactive'}
    </button>
  );

  const RowActions = ({ row }: { row: GiftGroupRow }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setFormFor(row.id)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        aria-label={`Edit ${row.name}`}
        suppressHydrationWarning
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
      <button
        onClick={() => setDeleteTarget(row)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
        aria-label={`Delete ${row.name}`}
        suppressHydrationWarning
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstOnPage = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastOnPage = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-4">
      {/* Filters + create */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="gift-group-search">
            Search gift groups
          </label>
          <input
            id="gift-group-search"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search gift groups..."
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A83A22] sm:max-w-xs"
            suppressHydrationWarning
          />
          <label className="sr-only" htmlFor="gift-group-status">
            Filter by status
          </label>
          <select
            id="gift-group-status"
            value={status}
            onChange={(e) => changeStatus(e.target.value as StatusFilter)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A83A22]"
            suppressHydrationWarning
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={() => setFormFor('new')}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#A83A22] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8e311d] disabled:opacity-60"
          suppressHydrationWarning
        >
          <Plus className="h-4 w-4" /> Create Gift Group
        </button>
      </div>

      {loading ? (
        <AdminTableCardSkeleton rows={5} columns={['30%', '35%', '15%', '20%']} />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <GiftIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-900">
            {search || status !== 'all' ? 'No gift groups match those filters' : 'No gift groups yet'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Create a group, pick the categories it applies to, then add the gifts customers can choose.
          </p>
        </div>
      ) : (
        <>
          {/* Phone/tablet: cards. A table this wide could only scroll sideways here. */}
          <ul className="space-y-3 md:hidden">
            {items.map((row) => (
              <li key={row.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{row.name}</p>
                    {row.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{row.description}</p>
                    )}
                  </div>
                  <StatusButton row={row} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-gray-400">Categories</dt>
                    <dd className="mt-0.5 text-gray-900">{row._count.categories}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Gifts</dt>
                    <dd className="mt-0.5 text-gray-900">{row._count.gifts}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-400">Applies to</dt>
                    <dd className="mt-0.5 text-gray-600">{categoryNames(row)}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <RowActions row={row} />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: the original table. Scrolls sideways when narrow or zoomed rather than
              cutting off the Actions column. */}
          <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
            <table className="sticky-actions w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Group Name</th>
                  <th className="px-4 py-3 font-medium">Categories</th>
                  <th className="px-4 py-3 font-medium">Gifts</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.name}</p>
                      {row.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{row.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">
                        {row._count.categories} {row._count.categories === 1 ? 'Category' : 'Categories'}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{categoryNames(row)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{row._count.gifts}</td>
                    <td className="px-4 py-3 text-gray-500">{row.displayOrder}</td>
                    <td className="px-4 py-3">
                      <StatusButton row={row} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActions row={row} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination: only once there is more than one page to move between. */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              aria-label="Gift group pages"
            >
              <p className="text-xs text-gray-500">
                {firstOnPage}-{lastOnPage} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((n) => Math.max(1, n - 1))}
                  disabled={page <= 1}
                  className="min-h-9 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  suppressHydrationWarning
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                  disabled={page >= totalPages}
                  className="min-h-9 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  suppressHydrationWarning
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {formFor && (
        <GiftGroupFormModal
          groupId={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={() => {
            setFormFor(null);
            load();
          }}
        />
      )}

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-gift-group-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onMouseDown={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="delete-gift-group-title" className="font-serif text-lg font-bold text-gray-900">
              Delete gift group?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure? {deleteTarget.name} and its {deleteTarget._count.gifts}{' '}
              {deleteTarget._count.gifts === 1 ? 'gift' : 'gifts'} will be removed, and it will stop
              appearing on product pages. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="min-h-11 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                suppressHydrationWarning
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                suppressHydrationWarning
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
