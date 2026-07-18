"use client";

import { useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { occasionSchema, type OccasionFormData } from '@/lib/validations/occasion';
import SingleMediaUploader from '@/components/admin/products/SingleMediaUploader';
import ProductSelector from './ProductSelector';

interface OccasionFormProps {
  initialData?: OccasionFormData & { id: string };
  isEdit?: boolean;
}

const SUBTITLE_MAX = 250;
const DESC_MAX = 600;

export default function OccasionForm({ initialData, isEdit }: OccasionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<OccasionFormData>({
    resolver: zodResolver(occasionSchema) as never,
    defaultValues: initialData || {
      title: '',
      subtitle: '',
      description: '',
      bannerImage: '',
      buttonText: '',
      buttonLink: '',
      isFeatured: false,
      displayOrder: 0,
      isActive: true,
      productIds: [],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = methods;

  const subtitle = watch('subtitle') || '';
  const description = watch('description') || '';
  const isActive = watch('isActive');
  const isFeatured = watch('isFeatured');

  const onSubmit = async (data: OccasionFormData) => {
    try {
      setIsLoading(true);
      const url = isEdit ? `/api/admin/occasions/${initialData?.id}` : '/api/admin/occasions';
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Something went wrong');
      }

      toast.success(isEdit ? 'Occasion updated successfully' : 'Occasion created successfully');
      router.push('/admin/occasions');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8"
        suppressHydrationWarning
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left: details */}
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Heading *</label>
              <input
                {...register('title')}
                maxLength={100}
                placeholder="e.g. Birthday Gifts"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]"
                suppressHydrationWarning
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Sub Heading *</label>
                <span
                  className={`text-xs ${subtitle.length > SUBTITLE_MAX ? 'text-red-500' : 'text-gray-400'}`}
                >
                  {subtitle.length}/{SUBTITLE_MAX}
                </span>
              </div>
              <textarea
                {...register('subtitle')}
                rows={3}
                maxLength={SUBTITLE_MAX}
                placeholder="Short line shown under the heading on the home page…"
                className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]"
                suppressHydrationWarning
              />
              {errors.subtitle && <p className="mt-1 text-sm text-red-500">{errors.subtitle.message}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <span className={`text-xs ${description.length > DESC_MAX ? 'text-red-500' : 'text-gray-400'}`}>
                  {description.length}/{DESC_MAX}
                </span>
              </div>
              <textarea
                {...register('description')}
                rows={4}
                maxLength={DESC_MAX}
                placeholder="The paragraph shown under the divider on the home page…"
                className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]"
                suppressHydrationWarning
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description.message as string}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Button Text</label>
                <input
                  {...register('buttonText')}
                  maxLength={50}
                  placeholder="View Collection"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]"
                  suppressHydrationWarning
                />
                <p className="mt-1 text-xs text-gray-400">Defaults to “View Collection”.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Button Link</label>
                <input
                  {...register('buttonLink')}
                  maxLength={255}
                  placeholder={`/occasion/${'{slug}'}`}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]"
                  suppressHydrationWarning
                />
                <p className="mt-1 text-xs text-gray-400">Leave blank to use the collection page.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Display Order</label>
                <input
                  type="number"
                  min={0}
                  {...register('displayOrder')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]"
                  suppressHydrationWarning
                />
                {errors.displayOrder && (
                  <p className="mt-1 text-sm text-red-500">{errors.displayOrder.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-4 pt-8">
                <label className="flex cursor-pointer items-center gap-3">
                  <div className="relative">
                    <input type="checkbox" {...register('isActive')} className="peer sr-only" suppressHydrationWarning />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>

                {/* Featured = the one collection promoted above New Arrivals. */}
                <label className="flex cursor-pointer items-center gap-3">
                  <div className="relative">
                    <input type="checkbox" {...register('isFeatured')} className="peer sr-only" suppressHydrationWarning />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#A83A22] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {isFeatured ? 'Featured' : 'Not featured'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: banner (reuses the project's uploader → Cloudinary signature flow) */}
          <div>
            <SingleMediaUploader
              fieldName="bannerImage"
              label="Banner Image"
              accept="image/jpeg,image/png,image/webp"
            />
            <p className="mt-2 text-xs text-gray-500">Optional. Shown above the occasion on the home page.</p>
            {errors.bannerImage && (
              <p className="mt-1 text-sm text-red-500">{errors.bannerImage.message as string}</p>
            )}
          </div>
        </div>

        {/* Product selection */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-medium text-gray-900">Products *</h3>
          <p className="mb-4 mt-1 text-sm text-gray-500">
            Choose which existing products appear in this occasion. At least one is required.
          </p>
          <Controller
            name="productIds"
            control={control}
            render={({ field }) => (
              <ProductSelector
                value={field.value ?? []}
                onChange={field.onChange}
                error={errors.productIds?.message as string | undefined}
              />
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
            suppressHydrationWarning
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-[#A83A22] px-6 py-2.5 font-medium text-white transition hover:bg-[#8e311d] disabled:cursor-not-allowed disabled:opacity-70"
            suppressHydrationWarning
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Occasion'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
