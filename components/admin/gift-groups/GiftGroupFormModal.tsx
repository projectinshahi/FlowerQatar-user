'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import SingleMediaUploader from '@/components/admin/products/SingleMediaUploader';
import { giftGroupSchema, type GiftGroupFormData } from '@/lib/validations/gift-group';
import { fixedCategoryLabel } from '@/lib/category-config';

interface CategoryOption {
  id: string;
  /** Stored name, e.g. SHOP_BY_OCCASION - rendered through fixedCategoryLabel. */
  name: string;
}

interface Props {
  /** null = create a new group. */
  groupId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyGift = { name: '', price: 0, image: '', isActive: true, displayOrder: 0 };

export default function GiftGroupFormModal({ groupId, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  // Index of the gift awaiting a remove confirmation; null = no dialog open.
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const methods = useForm<GiftGroupFormData>({
    resolver: zodResolver(giftGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      displayOrder: 0,
      categoryIds: [],
      gifts: [],
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: 'gifts' });
  // useWatch, not watch(): watch() re-renders this modal — and every gift row inside it — on
  // every keystroke in any field. This subscribes to the category selection alone.
  const selectedIds: string[] = useWatch({ control, name: 'categoryIds', defaultValue: [] });

  // Categories come from the existing Category System API - never a hardcoded list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [catRes, groupRes] = await Promise.all([
          fetch('/api/admin/categories'),
          groupId ? fetch(`/api/admin/gift-groups/${groupId}`) : Promise.resolve(null),
        ]);
        if (!catRes.ok) throw new Error('Failed to load categories');
        const catJson = await catRes.json();
        if (cancelled) return;
        setCategories(catJson.categories || []);

        if (groupRes) {
          if (!groupRes.ok) throw new Error((await groupRes.json()).error || 'Failed to load gift group');
          const g = await groupRes.json();
          if (cancelled) return;
          reset({
            name: g.name,
            description: g.description ?? '',
            isActive: g.isActive,
            displayOrder: g.displayOrder,
            categoryIds: (g.categories || []).map((c: { categoryId: string }) => c.categoryId),
            gifts: (g.gifts || []).map((gift: Record<string, unknown>) => ({
              id: gift.id,
              name: gift.name,
              price: gift.price,
              image: gift.image,
              isActive: gift.isActive,
              displayOrder: gift.displayOrder,
            })),
          });
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, reset]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => fixedCategoryLabel(c.name).toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const selectedCategories = useMemo(
    () => categories.filter((c) => selectedIds.includes(c.id)),
    [categories, selectedIds]
  );

  const toggleCategory = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    setValue('categoryIds', next, { shouldValidate: true, shouldDirty: true });
  };

  /**
   * On failure the modal stays open with everything the admin typed - nothing is reset, so a
   * network blip never costs them the form.
   */
  const submit = async (data: GiftGroupFormData) => {
    setSaving(true);
    try {
      const res = await fetch(groupId ? `/api/admin/gift-groups/${groupId}` : '/api/admin/gift-groups', {
        method: groupId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error ?? 'Unable to save');
      toast.success(groupId ? 'Gift group updated' : 'Gift group created');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-group-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={() => !saving && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="gift-group-title" className="font-serif text-xl font-bold text-gray-900">
            {groupId ? 'Edit Gift Group' : 'Create Gift Group'}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-60"
            aria-label="Close"
            suppressHydrationWarning
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(submit)} className="space-y-8 px-6 py-6">
              {/* ---------------- Group information ---------------- */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Group Information
                </h3>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Birthday Gifts"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A83A22]"
                    suppressHydrationWarning
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    placeholder="Optional. Shown above the gifts on the product page."
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A83A22]"
                    suppressHydrationWarning
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Display Order</label>
                    <input
                      type="number"
                      min={0}
                      {...register('displayOrder')}
                      className="w-32 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A83A22]"
                      suppressHydrationWarning
                    />
                    {errors.displayOrder && (
                      <p className="mt-1 text-sm text-red-600">{errors.displayOrder.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Lower shows first.</p>
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 pb-2">
                    <div className="relative inline-flex items-center">
                      <input type="checkbox" {...register('isActive')} className="peer sr-only" suppressHydrationWarning />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#A83A22] peer-checked:after:translate-x-full" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </section>

              {/* ---------------- Categories ---------------- */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Categories <span className="text-red-500">*</span>
                </h3>

                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#A83A22]/10 px-3 py-1 text-xs font-medium text-[#A83A22]"
                      >
                        {fixedCategoryLabel(c.name)}
                        <button
                          type="button"
                          onClick={() => toggleCategory(c.id)}
                          aria-label={`Remove ${fixedCategoryLabel(c.name)}`}
                          className="transition hover:text-[#8e311d]"
                          suppressHydrationWarning
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories"
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A83A22]"
                    suppressHydrationWarning
                  />
                </div>

                <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200">
                  {filteredCategories.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No categories match that search.</p>
                  ) : (
                    filteredCategories.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2.5 last:border-b-0 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleCategory(c.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#A83A22] focus:ring-[#A83A22]"
                          suppressHydrationWarning
                        />
                        <span className="text-sm text-gray-900">{fixedCategoryLabel(c.name)}</span>
                      </label>
                    ))
                  )}
                </div>
                {errors.categoryIds && (
                  <p className="text-sm text-red-600">{errors.categoryIds.message as string}</p>
                )}
              </section>

              {/* ---------------- Gifts ---------------- */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Gifts</h3>
                  <button
                    type="button"
                    onClick={() => append({ ...emptyGift, displayOrder: fields.length + 1 })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    suppressHydrationWarning
                  >
                    <Plus className="h-4 w-4" /> Add Gift
                  </button>
                </div>

                {fields.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                    No gifts yet. A group with no active gift is simply not shown on the storefront.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Gift {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRemoveIndex(index)}
                            aria-label={`Remove gift ${index + 1}`}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            suppressHydrationWarning
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-3">
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700">
                                Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                {...register(`gifts.${index}.name` as const)}
                                placeholder="e.g. Teddy Bear"
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A83A22]"
                                suppressHydrationWarning
                              />
                              {errors.gifts?.[index]?.name && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.gifts[index]?.name?.message as string}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700">
                                Price (QAR) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                {...register(`gifts.${index}.price` as const)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A83A22]"
                                suppressHydrationWarning
                              />
                              {errors.gifts?.[index]?.price && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.gifts[index]?.price?.message as string}
                                </p>
                              )}
                            </div>

                            <div className="flex items-end gap-6">
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Order</label>
                                <input
                                  type="number"
                                  min={0}
                                  {...register(`gifts.${index}.displayOrder` as const)}
                                  className="w-24 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A83A22]"
                                  suppressHydrationWarning
                                />
                              </div>
                              <label className="flex cursor-pointer items-center gap-3 pb-2">
                                <div className="relative inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register(`gifts.${index}.isActive` as const)}
                                    className="peer sr-only"
                                    suppressHydrationWarning
                                  />
                                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#A83A22] peer-checked:after:translate-x-full" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Active</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <SingleMediaUploader
                              fieldName={`gifts.${index}.image`}
                              label="Gift Image"
                              required
                              accept="image/jpeg,image/png,image/webp"
                              error={errors.gifts?.[index]?.image?.message as string | undefined}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ---------------- Actions ---------------- */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  suppressHydrationWarning
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#A83A22] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8e311d] disabled:opacity-60"
                  suppressHydrationWarning
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : groupId ? 'Save Changes' : 'Create Gift Group'}
                </button>
              </div>
            </form>
          </FormProvider>
        )}

        {/*
          Removing a gift used to happen on the first click. It is destructive once the group is
          saved, so it asks first — the same dialog the gift-group list uses, kept inside the form
          (z-60) so it sits above it. stopPropagation matters: without it a click here bubbles to
          the form's backdrop handler and closes the whole form.
        */}
        {removeIndex !== null && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-gift-title"
            className="fixed inset-0 z-60 grid place-items-center bg-black/50 p-4"
            onMouseDown={(e) => {
              e.stopPropagation();
              setRemoveIndex(null);
            }}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h2 id="remove-gift-title" className="font-serif text-lg font-bold text-gray-900">
                Remove this gift?
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to remove{' '}
                <span className="font-medium text-gray-900">
                  {getValues(`gifts.${removeIndex}.name`) || `gift ${removeIndex + 1}`}
                </span>{' '}
                from this group? It is deleted when you save your changes.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRemoveIndex(null)}
                  className="min-h-11 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  suppressHydrationWarning
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    remove(removeIndex);
                    setRemoveIndex(null);
                  }}
                  className="min-h-11 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  suppressHydrationWarning
                >
                  Remove Gift
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
