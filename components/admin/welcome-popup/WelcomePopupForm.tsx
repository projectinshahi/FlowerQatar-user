"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { welcomePopupSchema, type WelcomePopupFormData } from '@/lib/validations/welcome-popup';

const HEADING_MAX = 100;
const DESC_MAX = 400;
const inputCls =
  'w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]';

export default function WelcomePopupForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [exists, setExists] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<WelcomePopupFormData>({
    resolver: zodResolver(welcomePopupSchema),
    mode: 'onChange',
    defaultValues: { heading: '', description: '' },
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/welcome-popup');
        const json = await res.json();
        if (active && json?.success && json.data) {
          setExists(true);
          reset({ heading: json.data.heading, description: json.data.description });
        }
      } catch {
        if (active) toast.error('Failed to load welcome popup');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reset]);

  const heading = watch('heading') || '';
  const description = watch('description') || '';

  const onSubmit = async (data: WelcomePopupFormData) => {
    try {
      const res = await fetch('/api/admin/welcome-popup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Something went wrong');
      setExists(true);
      reset({ heading: json.data.heading, description: json.data.description });
      toast.success('Welcome popup saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 h-5 w-48 rounded skeleton" />
        <div className="space-y-6">
          <div className="h-10 w-full rounded-lg skeleton" />
          <div className="h-24 w-full rounded-lg skeleton" />
          <div className="h-10 w-40 rounded-lg skeleton" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8"
      suppressHydrationWarning
    >
      <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-[#A83A22]">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-gray-900">Welcome Popup</h2>
          <p className="text-sm text-gray-500">
            The heading and description shown in the storefront welcome dialog.
          </p>
        </div>
      </div>

      {/* Heading */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Heading <span className="text-red-500">*</span>
          </label>
          <span className={`text-xs ${heading.length > HEADING_MAX ? 'text-red-500' : 'text-gray-400'}`}>
            {heading.length}/{HEADING_MAX}
          </span>
        </div>
        <input {...register('heading')} maxLength={HEADING_MAX} placeholder="e.g. Exclusive Floral Collection" className={inputCls} suppressHydrationWarning />
        {errors.heading && <p className="mt-1 text-sm text-red-500">{errors.heading.message}</p>}
      </div>

      {/* Description */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <span className={`text-xs ${description.length > DESC_MAX ? 'text-red-500' : 'text-gray-400'}`}>
            {description.length}/{DESC_MAX}
          </span>
        </div>
        <textarea
          {...register('description')}
          rows={4}
          maxLength={DESC_MAX}
          placeholder="e.g. Discover handcrafted bouquets and luxury floral arrangements designed to make every occasion unforgettable."
          className={`${inputCls} resize-none`}
          suppressHydrationWarning
        />
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* The static parts, shown read-only so the admin knows the full layout */}
      <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Fixed content (not editable)</p>
        <p className="mt-2 text-sm text-gray-600">🌸 Premium Floral Experience</p>
        <p className="font-serif text-base text-gray-900">Welcome to Lebami,</p>
        <p className="mt-1 text-xs text-gray-400">Buttons: “Cancel” and “Explore Collection” → /products</p>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#A83A22] px-6 py-2.5 font-medium text-white transition hover:bg-[#8e311d] disabled:cursor-not-allowed disabled:opacity-60"
          suppressHydrationWarning
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {exists ? 'Update Welcome Popup' : 'Create Welcome Popup'}
        </button>
      </div>
    </form>
  );
}
