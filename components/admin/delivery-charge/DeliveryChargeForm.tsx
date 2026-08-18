"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Truck } from 'lucide-react';
import {
  deliveryChargeSchema,
  PERCENTAGE_MAX,
  type DeliveryChargeFormData,
} from '@/lib/validations/delivery-charge';

const inputCls =
  'w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]';

export default function DeliveryChargeForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [recordId, setRecordId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DeliveryChargeFormData>({
    resolver: zodResolver(deliveryChargeSchema) as never,
    mode: 'onChange', // so the submit button can disable while invalid
    defaultValues: { chargeType: 'FIXED', value: '', isActive: true, freeAbove: '' },
  });

  // Load the singleton config on mount (skeleton while loading).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/delivery-charge');
        const json = await res.json();
        if (active && json?.success && json.data) {
          setRecordId(json.data.id);
          reset({
            chargeType: json.data.chargeType,
            value: String(json.data.value),
            isActive: json.data.isActive ?? true,
            freeAbove: String(json.data.freeAbove ?? 0),
          });
        }
      } catch {
        if (active) toast.error('Failed to load delivery charge');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reset]);

  const chargeType = watch('chargeType');
  const isPercentage = chargeType === 'PERCENTAGE';
  const isEdit = recordId !== null;

  const onSubmit = async (data: DeliveryChargeFormData) => {
    try {
      const res = await fetch('/api/admin/delivery-charge', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Something went wrong');
      }
      // After a successful create, switch to update mode automatically.
      setRecordId(json.data.id);
      reset({
        chargeType: json.data.chargeType,
        value: String(json.data.value),
        isActive: json.data.isActive ?? true,
        freeAbove: String(json.data.freeAbove ?? 0),
      });
      toast.success(isEdit ? 'Delivery charge updated' : 'Delivery charge created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 h-5 w-40 rounded skeleton" />
        <div className="space-y-6">
          <div className="h-10 w-full rounded-lg skeleton" />
          <div className="h-10 w-full rounded-lg skeleton" />
          <div className="h-10 w-44 rounded-lg skeleton" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8"
      suppressHydrationWarning
    >
      <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-[#A83A22]">
          <Truck size={18} />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-gray-900">Delivery Charge Configuration</h2>
          <p className="text-sm text-gray-500">
            {isEdit ? 'Update the global delivery charge.' : 'Set the global delivery charge for all orders.'}
          </p>
        </div>
      </div>

      {/*
        Master switch. Placed first because it governs everything below — and turning it off
        keeps the configured amounts, so they do not have to be retyped when it comes back on.
      */}
      <div className="rounded-2xl border border-gray-200 bg-stone-50/60 p-4">
        <label className="flex cursor-pointer select-none items-start justify-between gap-4">
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold text-gray-900">Charge delivery fee</span>
            <span className="block text-xs text-gray-500">
              Turn off to make delivery free on every order. The amounts below are kept and
              take effect again when you switch this back on.
            </span>
          </span>
          <span className="relative inline-flex shrink-0 items-center">
            <input type="checkbox" {...register('isActive')} className="peer sr-only" />
            <span className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-[#A83A22] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </span>
        </label>
      </div>

      {/* Charge Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Charge Type <span className="text-red-500">*</span>
        </label>
        <select {...register('chargeType')} className={`${inputCls} bg-white`} suppressHydrationWarning>
          <option value="FIXED">Fixed</option>
          <option value="PERCENTAGE">Percentage</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Fixed adds a flat amount; Percentage adds a share of the order total.
        </p>
        {errors.chargeType && <p className="mt-1 text-sm text-red-500">{errors.chargeType.message}</p>}
      </div>

      {/* Value */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Value <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min={0}
            max={isPercentage ? PERCENTAGE_MAX : undefined}
            {...register('value')}
            placeholder={isPercentage ? 'Enter percentage' : 'Enter delivery charge'}
            className={`${inputCls} pr-14`}
            aria-invalid={!!errors.value}
            suppressHydrationWarning
          />
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-medium text-gray-400">
            {isPercentage ? '%' : 'QAR'}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {isPercentage ? 'Between 0 and 100. Decimals allowed.' : 'Any positive amount. Decimals allowed.'}
        </p>
        {errors.value && <p className="mt-1 text-sm text-red-500">{errors.value.message as string}</p>}
      </div>

      {/* Free-shipping threshold */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Free delivery above</label>
        <input
          type="number"
          step="0.01"
          min="0"
          {...register('freeAbove')}
          placeholder="0"
          className={inputCls}
          suppressHydrationWarning
        />
        <p className="mt-1 text-xs text-gray-400">
          Orders at or above this subtotal ship free. Leave 0 to always charge the fee.
        </p>
        {errors.freeAbove && (
          <p className="mt-1 text-sm text-red-500">{errors.freeAbove.message as string}</p>
        )}
      </div>

      {/* Submit — disabled while invalid or in-flight */}
      <div className="border-t border-gray-100 pt-6">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#A83A22] px-6 py-2.5 font-medium text-white transition hover:bg-[#8e311d] disabled:cursor-not-allowed disabled:opacity-60"
          suppressHydrationWarning
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Update Delivery Charge' : 'Create Delivery Charge'}
        </button>
      </div>
    </form>
  );
}
