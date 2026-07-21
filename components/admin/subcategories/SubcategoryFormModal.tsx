'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { subcategorySchema, slugify } from '@/lib/validations/subcategory';
import { CATEGORY_META } from '@/lib/category-config';
import type { CategoryType } from '@prisma/client';
import type { Subcat } from './SubcategoryManager';

type Features = { image: boolean; hoverColor: boolean; explore: boolean };

// Form schema mirrors subcategorySchema but accepts a blank slug (auto-derived on save).
const formSchema = subcategorySchema.extend({ slug: z.string().optional().or(z.literal('')) });
type FormData = z.input<typeof formSchema>;

export default function SubcategoryFormModal({
  categoryType,
  features,
  initial,
  onClose,
  onSaved,
}: {
  categoryType: CategoryType;
  features: Features;
  initial: Subcat | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      name: initial?.name ?? '',
      slug: initial?.slug ?? '',
      image: initial?.image ?? '',
      imagePublicId: initial?.imagePublicId ?? '',
      hoverColor: initial?.hoverColor ?? (features.hoverColor ? '#A83A22' : ''),
      explore: initial?.explore ?? false,
      displayOrder: initial?.displayOrder ?? 0,
      active: initial?.active ?? true,
    },
  });

  // preprocess-based fields widen to unknown in z.input, so read them as strings.
  const name = (watch('name') as string) || '';
  const slug = (watch('slug') as string) || '';
  const imageUrl = (watch('image') as string | null) || '';
  // Slug shown/used: the user's if they've touched it, else derived live from the name.
  const effectiveSlug = slugTouched ? slugify(slug) : slugify(name);

  const uploadToCloudinary = async (file: File) => {
    setUploading(true);
    setProgress(0);
    try {
      const sigRes = await fetch('/api/admin/cloudinary/signature');
      if (!sigRes.ok) throw new Error('Failed to get signature');
      const { signature, timestamp, apiKey, cloudName } = await sigRes.json();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', apiKey);
      fd.append('timestamp', timestamp.toString());
      fd.append('signature', signature);
      fd.append('folder', 'flower_products');
      return await new Promise<{ url: string; public_id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => {
          if (xhr.status === 200) {
            const r = JSON.parse(xhr.responseText);
            resolve({ url: r.secure_url, public_id: r.public_id });
          } else {
            let m = 'Upload failed';
            try { m = JSON.parse(xhr.responseText)?.error?.message || m; } catch {}
            reject(new Error(m));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(fd);
      });
    } finally {
      setUploading(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error('Only JPG, PNG, WEBP');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    try {
      const { url, public_id } = await uploadToCloudinary(file);
      setValue('image', url, { shouldValidate: true });
      setValue('imagePublicId', public_id);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const removeImage = () => {
    setValue('image', '', { shouldValidate: true });
    setValue('imagePublicId', '');
    if (fileRef.current) fileRef.current.value = '';
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const cleanSlug = slugify((slugTouched ? data.slug : data.name) || '');
      const payload: Record<string, unknown> = {
        name: data.name,
        image: features.image ? data.image : '',
        imagePublicId: features.image ? data.imagePublicId : '',
        hoverColor: features.hoverColor ? data.hoverColor : '',
        explore: features.explore ? data.explore : false,
        displayOrder: data.displayOrder,
        active: data.active,
      };
      if (cleanSlug) payload.slug = cleanSlug; // else server derives from name
      if (!isEdit) payload.categoryType = categoryType;

      const res = await fetch(
        isEdit ? `/api/admin/subcategories/${initial!.id}` : '/api/admin/subcategories',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Something went wrong');
      }
      toast.success(isEdit ? 'Subcategory updated' : 'Subcategory created');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Subcategory' : 'New Subcategory'}</h3>
            <p className="text-xs text-gray-500">{CATEGORY_META[categoryType].label}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
            <input
              {...register('name')}
              autoFocus
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#A83A22] focus:border-transparent outline-none transition"
              placeholder="e.g. Cake Combos"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Slug + live URL preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL slug</label>
            <input
              {...register('slug')}
              onChange={(e) => {
                setSlugTouched(true);
                setValue('slug', e.target.value);
              }}
              value={slugTouched ? slug : effectiveSlug}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#A83A22] focus:border-transparent outline-none transition font-mono text-sm"
              placeholder="auto-generated"
            />
            <p className="text-xs text-gray-400 mt-1 truncate">
              Preview: <span className="font-mono text-gray-600">{CATEGORY_META[categoryType].base}/{effectiveSlug || '…'}</span>
            </p>
          </div>

          {/* Image (Flower / Explore) */}
          {features.image && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" ref={fileRef} onChange={onFile} />
              <input type="hidden" {...register('image')} />
              <input type="hidden" {...register('imagePublicId')} />
              {!imageUrl ? (
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 h-40 transition-colors ${
                    uploading ? 'bg-gray-50 border-gray-300 cursor-not-allowed' : 'border-gray-300 hover:border-[#A83A22] hover:bg-orange-50 cursor-pointer'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-7 h-7 text-[#A83A22] animate-spin mb-2" />
                      <p className="text-sm text-gray-600">Uploading {progress}%</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload (JPG/PNG/WEBP, ≤5MB)</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative h-40 rounded-xl overflow-hidden border border-gray-200 group bg-gray-100">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button type="button" onClick={() => fileRef.current?.click()} className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium">Replace</button>
                    <button type="button" onClick={removeImage} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium">Remove</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hover color (Flower) */}
          {features.hoverColor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hover color</label>
              <Controller
                name="hoverColor"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div className="flex gap-3 items-center">
                    <input type="color" value={(value as string) || '#A83A22'} onChange={(e) => onChange(e.target.value.toUpperCase())} className="w-11 h-11 p-1 border border-gray-200 rounded cursor-pointer" />
                    <input type="text" value={(value as string) || ''} onChange={(e) => onChange(e.target.value.toUpperCase())} placeholder="#A83A22" className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#A83A22] focus:border-transparent outline-none transition uppercase font-mono text-sm" />
                  </div>
                )}
              />
              {errors.hoverColor && <p className="text-red-500 text-sm mt-1">{errors.hoverColor.message}</p>}
            </div>
          )}

          {/* Display order + toggles */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Display order</label>
              <input type="number" {...register('displayOrder')} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#A83A22] focus:border-transparent outline-none transition" />
            </div>
            <div className="flex flex-col gap-3 pt-7">
              {features.explore && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" {...register('explore')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Show in home garden</span>
                </label>
              )}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" {...register('active')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
                </div>
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="px-5 py-2.5 bg-[#A83A22] text-white rounded-lg hover:bg-[#8e311d] transition font-medium disabled:opacity-70 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
