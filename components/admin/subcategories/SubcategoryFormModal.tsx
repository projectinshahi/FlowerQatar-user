'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UploadCloud, X, FolderTree, Sparkles, Palette, Check, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { subcategorySchema, type SubcategoryFormData } from '@/lib/validations/subcategory';
import { fixedCategoryLabel } from '@/lib/category-config';
import type { Subcat } from './SubcategoryManager';

type Category = { id: string; name: string };

const PRESET_HOVER_COLORS = [
  { name: 'Royal Maroon', hex: '#61000B' },
  { name: 'Terracotta', hex: '#8E311D' },
  { name: 'Crimson', hex: '#9B2C2C' },
  { name: 'Rose Plum', hex: '#702459' },
  { name: 'Dusty Rose', hex: '#B76E79' },
  { name: 'Deep Teal', hex: '#285E61' },
  { name: 'Emerald', hex: '#2F855A' },
  { name: 'Warm Bronze', hex: '#744210' },
  { name: 'Midnight Onyx', hex: '#1A202C' },
  { name: 'Slate', hex: '#4A5568' },
];

interface SubcategoryFormModalProps {
  initial: Subcat | null;
  categories: Category[];
  fixedCategoryName?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SubcategoryFormModal({
  initial,
  categories,
  fixedCategoryName,
  onClose,
  onSaved,
}: SubcategoryFormModalProps) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine the target fixed category if inside a specific category view
  const targetCategory = fixedCategoryName
    ? categories.find((c) => c.name === fixedCategoryName)
    : categories.find((c) => c.id === initial?.categoryId) || categories[0];

  const defaultCategoryId = initial?.categoryId || targetCategory?.id || '';

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<SubcategoryFormData>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      categoryId: defaultCategoryId,
      name: initial?.name ?? '',
      hoverImage: initial?.hoverImage ?? null,
      showInNavigation: initial?.showInNavigation ?? true,
      isExploreGarden: initial?.isExploreGarden ?? false,
      hoverColor: initial?.hoverColor ?? '#61000B',
      isActive: initial?.isActive ?? true,
    },
  });

  // Ensure categoryId is synced if categories load or change
  useEffect(() => {
    if (!initial && targetCategory?.id) {
      setValue('categoryId', targetCategory.id, { shouldValidate: true });
    }
  }, [targetCategory, initial, setValue]);

  const hoverImage = useWatch({ control, name: 'hoverImage' });
  const isExploreGarden = useWatch({ control, name: 'isExploreGarden' });
  const hoverColor = useWatch({ control, name: 'hoverColor' }) || '#61000B';
  const subName = useWatch({ control, name: 'name' }) || 'Flower Name';

  const getContrastColor = (hex: string) => {
    const clean = hex.replace('#', '');
    if (clean.length !== 6 && clean.length !== 3) return '#FFFFFF';
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#111111' : '#FFFFFF';
  };

  const upload = async (source: File) => {
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadToCloudinary(source, setProgress);
      setValue('hoverImage', url, { shouldDirty: true, shouldValidate: true });
      toast.success('Hover image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (data: SubcategoryFormData) => {
    setSaving(true);
    try {
      const response = await fetch(
        initial ? `/api/admin/subcategories/${initial.id}` : '/api/admin/subcategories',
        {
          method: initial ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Unable to save');
      toast.success(initial ? 'Subcategory updated' : 'Subcategory created');
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  const isSpecificCategory = Boolean(fixedCategoryName) || categories.length === 1;
  const currentCategoryName = fixedCategoryName || initial?.category?.name || targetCategory?.name || '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subcategory-form-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
          <div>
            <h2 id="subcategory-form-title" className="text-lg font-bold text-gray-900">
              {initial ? 'Edit' : 'New'}{' '}
              {isSpecificCategory && currentCategoryName
                ? `${fixedCategoryLabel(currentCategoryName)} `
                : ''}
              Subcategory
            </h2>
            <p className="text-xs text-gray-500">
              {isSpecificCategory
                ? `Add subcategory details for ${fixedCategoryLabel(currentCategoryName)}.`
                : 'Set a parent category, hover image, and availability.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-5 p-5">
          {/* If already in a specific category, show a clean read-only badge and hidden input.
              Only show category selector if not in a specific category. */}
          {isSpecificCategory ? (
            <div>
              <input type="hidden" {...register('categoryId')} />
              <div className="flex items-center gap-2 rounded-xl bg-orange-50/80 border border-orange-100 px-3.5 py-2.5 text-sm text-gray-700">
                <FolderTree className="h-4 w-4 text-[#A83A22]" />
                <span className="text-gray-500 font-medium">Category:</span>
                <span className="font-semibold text-gray-900">
                  {fixedCategoryLabel(currentCategoryName)}
                </span>
              </div>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Parent Category *
              </label>
              <select
                {...register('categoryId')}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#A83A22] bg-white"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {fixedCategoryLabel(c.name)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Only active categories are available.</p>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Subcategory Name *
            </label>
            <input
              autoFocus
              {...register('name')}
              maxLength={100}
              placeholder="e.g. Roses"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#A83A22]"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Hover Image</label>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            {hoverImage ? (
              <div className="relative h-48 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                <Image
                  src={hoverImage}
                  alt="Hover image preview"
                  fill
                  sizes="(max-width: 640px) 100vw, 576px"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-black/50 p-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('hoverImage', null, { shouldDirty: true })}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) upload(file);
                }}
                onDragOver={(e) => e.preventDefault()}
                className="flex h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 transition hover:border-[#A83A22] hover:bg-orange-50/50 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mb-2 h-6 w-6 animate-spin text-[#A83A22]" />
                    Uploading {progress}%
                  </>
                ) : (
                  <>
                    <UploadCloud className="mb-2 h-7 w-7 text-gray-400" />
                    <span className="font-medium text-gray-700">Drop an image here or click to upload</span>
                    <span className="text-xs text-gray-400 mt-1">JPG, PNG, or WEBP up to 5MB</span>
                  </>
                )}
              </button>
            )}
            {errors.hoverImage && (
              <p className="mt-1 text-sm text-red-600">{errors.hoverImage.message}</p>
            )}
          </div>

          {/* Show in the storefront category strip — independent of Explore for Garden below. */}
          <div className="rounded-2xl border border-gray-200/80 bg-stone-50/50 p-4 transition-all">
            <label className="flex items-start justify-between gap-4 cursor-pointer select-none">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[#A83A22]" />
                  <span className="text-sm font-semibold text-gray-900">Show in Flower Navigation</span>
                </div>
                <p className="text-xs text-gray-500">
                  Show in the storefront category strip. Works independently of Active status.
                </p>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" {...register('showInNavigation')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A83A22]"></div>
              </div>
            </label>
          </div>

          {/* Explore for Garden section */}
          <div className="rounded-2xl border border-gray-200/80 bg-stone-50/50 p-4 transition-all">
            <label className="flex items-start justify-between gap-4 cursor-pointer select-none">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#A83A22]" />
                  <span className="text-sm font-semibold text-gray-900">Explore for Garden</span>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A83A22]">
                    Home Page
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Show in the homepage &quot;Explore Our Gardens&quot; section with a custom hover color.
                </p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  {...register('isExploreGarden')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A83A22]"></div>
              </div>
            </label>

            {/* Conditional Hover Color section when isExploreGarden is TRUE */}
            {isExploreGarden && (
              <div className="mt-4 pt-4 border-t border-gray-200/80 space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                    <Palette className="h-3.5 w-3.5 text-[#A83A22]" />
                    Hover Overlay Color *
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Select a curated luxury color or pick any custom hex shade.
                  </p>

                  {/* Preset swatches */}
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-3">
                    {PRESET_HOVER_COLORS.map((preset) => {
                      const isSelected = hoverColor.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          title={preset.name}
                          onClick={() => setValue('hoverColor', preset.hex, { shouldDirty: true, shouldValidate: true })}
                          className={`group relative h-8 w-full rounded-lg transition-transform hover:scale-105 flex items-center justify-center shadow-xs cursor-pointer ${
                            isSelected ? 'ring-2 ring-[#A83A22] ring-offset-2 scale-105' : 'border border-black/10'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && (
                            <Check
                              className="h-4 w-4 drop-shadow-sm"
                              style={{ color: getContrastColor(preset.hex) }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Color picker input + Hex code field */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-xs">
                      <input
                        type="color"
                        value={hoverColor}
                        onChange={(e) => setValue('hoverColor', e.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true })}
                        className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0 outline-none"
                      />
                      <span className="text-xs font-mono font-medium text-gray-600 uppercase">
                        {hoverColor}
                      </span>
                    </div>

                    <div className="flex-1">
                      <input
                        {...register('hoverColor')}
                        placeholder="#61000B"
                        maxLength={7}
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-[#A83A22]"
                      />
                    </div>
                  </div>
                  {errors.hoverColor && (
                    <p className="mt-1 text-sm text-red-600">{errors.hoverColor.message}</p>
                  )}
                </div>

                {/* Live Card Hover Preview */}
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                    Storefront Card Hover Preview
                  </span>
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100 group border border-gray-200">
                    {hoverImage ? (
                      <Image
                        src={hoverImage}
                        alt="Preview"
                        fill
                        sizes="300px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        Upload hover image to preview card
                      </div>
                    )}
                    {/* Overlay with selected hoverColor */}
                    <div
                      className="absolute inset-0 transition-opacity duration-300 flex items-center justify-center"
                      style={{
                        backgroundColor: hoverColor,
                        opacity: 0.85,
                      }}
                    >
                      <span
                        className="font-serif text-lg tracking-wide drop-shadow-sm px-4 text-center font-medium"
                        style={{ color: getContrastColor(hoverColor) }}
                      >
                        {subName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 rounded accent-[#A83A22] cursor-pointer"
            />
            Active (visible on storefront navigation)
          </label>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#A83A22] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8e311d] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? 'Save Changes' : 'Create Subcategory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
