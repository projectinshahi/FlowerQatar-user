"use client";

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import {
  subscriptionPlanSchema,
  formatValidity,
  type SubscriptionPlanFormData,
} from '@/lib/validations/subscription-plan';
import ProductSelector from '@/components/admin/occasions/ProductSelector';

/** Admin shape passed to the modal (includes the current productIds for pre-selection). */
export interface AdminPlan {
  id: string;
  name: string;
  accent: string;
  featurePoints: number;
  price: number;
  validityYears: number;
  validityMonths: number;
  validityDays: number;
  productIds: string[];
}

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]';

export default function EditPlanModal({
  plan, onClose, onSaved,
}: { plan: AdminPlan; onClose: () => void; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionPlanFormData>({
    resolver: zodResolver(subscriptionPlanSchema) as never,
    defaultValues: {
      featurePoints: plan.featurePoints,
      price: plan.price,
      validityYears: plan.validityYears,
      validityMonths: plan.validityMonths,
      validityDays: plan.validityDays,
      productIds: plan.productIds,
    },
  });

  useEffect(() => {
    reset({
      featurePoints: plan.featurePoints,
      price: plan.price,
      validityYears: plan.validityYears,
      validityMonths: plan.validityMonths,
      validityDays: plan.validityDays,
      productIds: plan.productIds,
    });
  }, [plan, reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const y = Number(watch('validityYears')) || 0;
  const m = Number(watch('validityMonths')) || 0;
  const d = Number(watch('validityDays')) || 0;
  const preview = formatValidity(y, m, d);

  const onSubmit = async (data: SubscriptionPlanFormData) => {
    try {
      const res = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Something went wrong');
      }
      toast.success(`${plan.name} plan updated`);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${plan.name} plan`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Header — tinted with the tier accent */}
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: plan.accent }} aria-hidden="true" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Edit Plan</p>
                <h2 className="font-serif text-xl font-bold text-gray-900">{plan.name}</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 p-6">
            {/* Plan name (read-only) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Plan Name</label>
              <input value={plan.name} readOnly disabled className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500" />
              <p className="mt-1 text-xs text-gray-400">The plan name is fixed and cannot be changed.</p>
            </div>

            {/* Feature points + Price — single numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Feature Points</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  {...register('featurePoints')}
                  placeholder="e.g. 500"
                  className={inputCls}
                  aria-label="Feature points (a single number)"
                  suppressHydrationWarning
                />
                {errors.featurePoints && <p className="mt-1 text-sm text-red-500">{errors.featurePoints.message as string}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Price (QAR)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('price')}
                  placeholder="e.g. 199"
                  className={inputCls}
                  aria-label="Plan price in QAR"
                  suppressHydrationWarning
                />
                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message as string}</p>}
              </div>
            </div>

            {/* Validity */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Validity</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Years</label>
                  <input type="number" min={0} max={10} {...register('validityYears')} className={`${inputCls} text-center`} aria-label="Years (0–10)" suppressHydrationWarning />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Months</label>
                  <input type="number" min={0} max={12} {...register('validityMonths')} className={`${inputCls} text-center`} aria-label="Months (0–12)" suppressHydrationWarning />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Days</label>
                  <input type="number" min={0} max={365} {...register('validityDays')} className={`${inputCls} text-center`} aria-label="Days (0–365)" suppressHydrationWarning />
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/70 px-4 py-3" aria-live="polite">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Validity Preview</p>
                <p className="mt-0.5 font-medium text-gray-900">{preview || 'Set a validity above'}</p>
              </div>
              {(errors.validityYears || errors.validityMonths || errors.validityDays) && (
                <p className="mt-2 text-sm text-red-500">
                  {(errors.validityYears || errors.validityMonths || errors.validityDays)?.message as string}
                </p>
              )}
            </div>

            {/* Applicable products */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Applicable Products</label>
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded-lg bg-[#A83A22] px-5 py-2 font-medium text-white transition hover:bg-[#8e311d] disabled:opacity-70">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
