'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2, Pencil, Plus, Search, Trash2, ImageOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import SubcategoryFormModal from './SubcategoryFormModal';
import { fixedCategoryLabel } from '@/lib/category-config';

export interface Subcat {
  id: string;
  categoryId: string;
  name: string;
  hoverImage: string | null;
  isExploreGarden: boolean;
  hoverColor: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  _count?: { products: number };
}

type Category = { id: string; name: string };
type SortBy = 'name' | 'createdAt' | 'updatedAt';

const date = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));

export default function SubcategoryManager({ fixedCategoryName }: { fixedCategoryName?: string }) {
  const [items, setItems] = useState<Subcat[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subcat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subcat | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let activeCategoryId = categoryId;

      // If we are in a fixed category view and categoryId is not yet resolved, fetch categories first
      let currentCategories = categories;
      if (fixedCategoryName && (!activeCategoryId || currentCategories.length === 0)) {
        const parentsRes = await fetch('/api/admin/categories');
        if (parentsRes.ok) {
          const parentData = await parentsRes.json();
          currentCategories = parentData.categories || [];
          setCategories(currentCategories);
          const found = currentCategories.find((c) => c.name === fixedCategoryName);
          if (found) {
            activeCategoryId = found.id;
            setCategoryId(found.id);
          }
        }
      }

      const p = new URLSearchParams({
        search,
        categoryId: activeCategoryId,
        status,
        sortBy,
        sortOrder,
        limit: '100',
      });

      const [list, parents] = await Promise.all([
        fetch(`/api/admin/subcategories?${p}`),
        currentCategories.length > 0 ? Promise.resolve(null) : fetch('/api/admin/categories'),
      ]);

      if (!list.ok) throw new Error();
      const listData = await list.json();
      setItems(listData.subcategories || []);

      if (parents && parents.ok) {
        const parentData = await parents.json();
        setCategories(parentData.categories || []);
      }
    } catch {
      toast.error('Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, status, sortBy, sortOrder, fixedCategoryName, categories]);

  useEffect(() => {
    const timer = window.setTimeout(load, 300);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!fixedCategoryName || categories.length === 0) return;
    const match = categories.find((c) => c.name === fixedCategoryName);
    if (match && categoryId !== match.id) {
      setCategoryId(match.id);
    }
  }, [categories, fixedCategoryName, categoryId]);

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder((v) => (v === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const deleteSubcategory = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/subcategories/${deleteTarget.id}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success('Subcategory deleted');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const sortLabel = useMemo(
    () => (field: SortBy) =>
      `${field === 'name' ? 'Name' : field === 'createdAt' ? 'Created' : 'Updated'}${
        sortBy === field ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''
      }`,
    [sortBy, sortOrder]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              suppressHydrationWarning
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                fixedCategoryName
                  ? `Search ${fixedCategoryLabel(fixedCategoryName)} subcategories...`
                  : 'Search subcategories...'
              }
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#A83A22]"
            />
          </div>
          <button
            suppressHydrationWarning
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A83A22] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8e311d] shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Subcategory
          </button>
        </div>

        <div className={`grid grid-cols-1 gap-2 ${fixedCategoryName ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
          {!fixedCategoryName && (
            <select
              suppressHydrationWarning
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#A83A22]"
            >
              <option value="">All parent categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {fixedCategoryLabel(c.name)}
                </option>
              ))}
            </select>
          )}
          <select
            suppressHydrationWarning
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#A83A22]"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex gap-2">
            {(['name', 'createdAt', 'updatedAt'] as SortBy[]).map((field) => (
              <button
                suppressHydrationWarning
                key={field}
                onClick={() => toggleSort(field)}
                className={`flex-1 rounded-xl border border-gray-200 px-2 py-2 text-xs font-medium transition-colors ${
                  sortBy === field ? 'bg-gray-100 text-gray-900 font-semibold' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {sortLabel(field)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-14 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#A83A22]" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-14 text-center text-sm text-gray-500">
            No subcategories match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="p-4">Hover image</th>
                  <th className="p-4">Subcategory</th>
                  {!fixedCategoryName && <th className="p-4">Parent category</th>}
                  <th className="p-4">Explore Garden</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4">
                      <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                        {item.hoverImage ? (
                          <Image
                            src={item.hoverImage}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <ImageOff className="m-3 h-5 w-5 text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {item.name}
                      {item._count?.products ? (
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          ({item._count.products} products)
                        </span>
                      ) : null}
                    </td>
                    {!fixedCategoryName && (
                      <td className="p-4 text-gray-600">
                        {fixedCategoryLabel(item.category.name)}
                      </td>
                    )}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={async () => {
                          const nextExplore = !item.isExploreGarden;
                          const r = await fetch(`/api/admin/subcategories/${item.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              isExploreGarden: nextExplore,
                              hoverColor: item.hoverColor || '#61000B',
                            }),
                          });
                          if (r.ok) {
                            setItems((rows) =>
                              rows.map((x) =>
                                x.id === item.id
                                  ? { ...x, isExploreGarden: nextExplore, hoverColor: x.hoverColor || '#61000B' }
                                  : x
                              )
                            );
                            toast.success(
                              nextExplore ? 'Featured in Home Garden' : 'Removed from Home Garden'
                            );
                          } else {
                            toast.error('Failed to update garden status');
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          item.isExploreGarden
                            ? 'bg-orange-50 text-[#A83A22] border border-orange-200/70 hover:bg-orange-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={
                          item.isExploreGarden
                            ? 'Featured in Explore Our Gardens (Click to toggle)'
                            : 'Click to feature in Explore Our Gardens'
                        }
                      >
                        {item.isExploreGarden ? (
                          <>
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-black/10 shadow-xs"
                              style={{ backgroundColor: item.hoverColor || '#61000B' }}
                            />
                            <span>In Garden</span>
                          </>
                        ) : (
                          <span>Off</span>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={async () => {
                          const r = await fetch(`/api/admin/subcategories/${item.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isActive: !item.isActive }),
                          });
                          if (r.ok) {
                            setItems((rows) =>
                              rows.map((x) => (x.id === item.id ? { ...x, isActive: !x.isActive } : x))
                            );
                            toast.success('Status updated');
                          } else {
                            toast.error('Status update failed');
                          }
                        }}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 text-gray-500">{date(item.createdAt)}</td>
                    <td className="p-4 text-gray-500">{date(item.updatedAt)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(item);
                            setFormOpen(true);
                          }}
                          aria-label={`Edit ${item.name}`}
                          className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`Delete ${item.name}`}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <SubcategoryFormModal
          initial={editing}
          fixedCategoryName={fixedCategoryName}
          categories={
            fixedCategoryName
              ? categories.filter((category) => category.name === fixedCategoryName)
              : categories
          }
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Delete subcategory?</h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteTarget.name}</span>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={deleteSubcategory}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
