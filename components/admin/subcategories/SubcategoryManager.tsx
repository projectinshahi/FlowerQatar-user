'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Reorder, useDragControls } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus, Search, Loader2, GripVertical, Pencil, Trash2, Pin, Sparkles, ImageOff,
} from 'lucide-react';
import type { CategoryType } from '@prisma/client';
import SubcategoryFormModal from './SubcategoryFormModal';

export interface Subcat {
  id: string;
  categoryType: CategoryType;
  name: string;
  slug: string;
  image: string | null;
  imagePublicId: string | null;
  hoverColor: string | null;
  explore: boolean;
  pinned: boolean;
  displayOrder: number;
  active: boolean;
  _count?: { products: number };
}

type Features = { image: boolean; hoverColor: boolean; explore: boolean };

export default function SubcategoryManager({
  categoryType,
  features,
}: {
  categoryType: CategoryType;
  features: Features;
}) {
  const [pinned, setPinned] = useState<Subcat | null>(null);
  const [items, setItems] = useState<Subcat[]>([]); // non-pinned, ordered
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subcat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subcat | null>(null);
  const [deleting, setDeleting] = useState(false);
  const savedOrderRef = useRef<string>('');

  const load = useCallback(
    async (q: string) => {
      try {
        const res = await fetch(
          `/api/admin/subcategories?categoryType=${categoryType}&search=${encodeURIComponent(q)}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const all: Subcat[] = data.subcategories;
        setPinned(all.find((s) => s.pinned) ?? null);
        const rest = all.filter((s) => !s.pinned);
        setItems(rest);
        savedOrderRef.current = rest.map((s) => s.id).join(',');
      } catch {
        toast.error('Failed to load subcategories');
      } finally {
        setLoading(false);
      }
    },
    [categoryType]
  );

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const refetch = () => load(search);

  // Persist a drag reorder (only the non-pinned rows, only when the order changed).
  const persistOrder = async () => {
    const order = items.map((s) => s.id);
    if (order.join(',') === savedOrderRef.current) return;
    savedOrderRef.current = order.join(',');
    try {
      const res = await fetch('/api/admin/subcategories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: order }),
      });
      if (!res.ok) throw new Error();
      toast.success('Order saved');
    } catch {
      toast.error('Failed to save order');
      refetch();
    }
  };

  const patch = async (item: Subcat, body: Partial<Pick<Subcat, 'active' | 'explore'>>) => {
    const apply = (v: Subcat) => ({ ...v, ...body });
    // Optimistic
    if (item.pinned) setPinned((p) => (p ? apply(p) : p));
    else setItems((list) => list.map((s) => (s.id === item.id ? apply(s) : s)));
    try {
      const res = await fetch(`/api/admin/subcategories/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error('Update failed');
      refetch();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/subcategories/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      toast.success('Subcategory deleted');
      setItems((list) => list.filter((s) => s.id !== deleteTarget.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (s: Subcat) => {
    setEditing(s);
    setShowForm(true);
  };

  const canDrag = search.trim() === '';
  const total = (pinned ? 1 : 0) + items.length;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search subcategories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A83A22] focus:border-transparent outline-none transition"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#A83A22] text-white px-5 py-2.5 rounded-xl hover:bg-[#8e311d] transition whitespace-nowrap font-medium"
        >
          <Plus className="w-5 h-5" /> Add Subcategory
        </button>
      </div>

      {!canDrag && (
        <p className="text-xs text-gray-400 -mt-1 px-1">
          Reordering is disabled while searching. Clear the search to drag rows.
        </p>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-[#A83A22] animate-spin mx-auto" />
          </div>
        ) : total === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Search className="w-9 h-9 text-orange-300" />
            </div>
            <p className="text-gray-900 font-medium text-lg">No subcategories yet</p>
            <p className="text-gray-500 mt-1">
              {search ? 'No matches for your search.' : 'Add the first subcategory to get started.'}
            </p>
          </div>
        ) : (
          <div role="list" className="divide-y divide-gray-100">
            {/* Pinned "All …" row — always first, non-draggable, non-deletable */}
            {pinned && (search.trim() === '' || pinned.name.toLowerCase().includes(search.toLowerCase())) && (
              <RowContent
                key={pinned.id}
                item={pinned}
                features={features}
                onToggleActive={() => patch(pinned, { active: !pinned.active })}
                onToggleExplore={() => patch(pinned, { explore: !pinned.explore })}
                onEdit={() => openEdit(pinned)}
                onDelete={undefined}
              />
            )}

            {canDrag ? (
              <Reorder.Group axis="y" values={items} onReorder={setItems} as="div">
                {items.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    features={features}
                    onDragEnd={persistOrder}
                    onToggleActive={() => patch(item, { active: !item.active })}
                    onToggleExplore={() => patch(item, { explore: !item.explore })}
                    onEdit={() => openEdit(item)}
                    onDelete={() => setDeleteTarget(item)}
                  />
                ))}
              </Reorder.Group>
            ) : (
              items.map((item) => (
                <RowContent
                  key={item.id}
                  item={item}
                  features={features}
                  onToggleActive={() => patch(item, { active: !item.active })}
                  onToggleExplore={() => patch(item, { explore: !item.explore })}
                  onEdit={() => openEdit(item)}
                  onDelete={() => setDeleteTarget(item)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <SubcategoryFormModal
          categoryType={categoryType}
          features={features}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete “{deleteTarget.name}”?</h3>
            <p className="text-center text-gray-500 mb-6">
              This permanently removes the subcategory{deleteTarget.image ? ' and its image' : ''}. This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** A draggable list row: Reorder.Item wrapper + a grip handle wired to drag controls. */
function SortableRow({
  item,
  features,
  onDragEnd,
  onToggleActive,
  onToggleExplore,
  onEdit,
  onDelete,
}: {
  item: Subcat;
  features: Features;
  onDragEnd: () => void;
  onToggleActive: () => void;
  onToggleExplore: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      as="div"
      className="bg-white"
    >
      <RowContent
        item={item}
        features={features}
        dragHandle={
          <button
            type="button"
            onPointerDown={(e) => controls.start(e)}
            aria-label="Drag to reorder"
            className="cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-500 p-1"
          >
            <GripVertical className="w-5 h-5" />
          </button>
        }
        onToggleActive={onToggleActive}
        onToggleExplore={onToggleExplore}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Reorder.Item>
  );
}

/** Shared presentation for one subcategory row (used draggable, static, and pinned). */
function RowContent({
  item,
  features,
  dragHandle,
  onToggleActive,
  onToggleExplore,
  onEdit,
  onDelete,
}: {
  item: Subcat;
  features: Features;
  dragHandle?: React.ReactNode;
  onToggleActive: () => void;
  onToggleExplore: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div role="listitem" className="flex items-center gap-3 p-4 hover:bg-gray-50/60 transition group">
      {/* Drag handle (or spacer for pinned/static) */}
      <div className="w-7 flex justify-center">{dragHandle ?? (item.pinned ? <Pin className="w-4 h-4 text-[#A83A22]" /> : null)}</div>

      {/* Thumb */}
      {features.image && (
        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
          {item.image ? (
            <Image src={item.image} alt={item.name} fill className="object-cover" />
          ) : (
            <ImageOff className="w-4 h-4 text-gray-300" />
          )}
        </div>
      )}

      {/* Name + slug */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">{item.name}</p>
          {item.pinned && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#A83A22] bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded">
              Default
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          /{item.slug}
          {typeof item._count?.products === 'number' && (
            <span className="ml-2 text-gray-400">· {item._count.products} product{item._count.products === 1 ? '' : 's'}</span>
          )}
        </p>
      </div>

      {/* Explore toggle (Flower only) */}
      {features.explore && (
        <button
          onClick={onToggleExplore}
          title="Show in home “Explore Our Garden”"
          className={`hidden sm:inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium border transition ${
            item.explore
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> {item.explore ? 'In garden' : 'Hidden'}
        </button>
      )}

      {/* Active toggle */}
      <button
        onClick={onToggleActive}
        aria-label={item.active ? 'Deactivate' : 'Activate'}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#A83A22] focus:ring-offset-2 shrink-0 ${
          item.active ? 'bg-green-500' : 'bg-gray-200'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.active ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" aria-label="Edit">
          <Pencil className="w-4 h-4" />
        </button>
        {onDelete ? (
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <span className="p-2 text-gray-200" title="The default “All” item cannot be deleted">
            <Trash2 className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
}
