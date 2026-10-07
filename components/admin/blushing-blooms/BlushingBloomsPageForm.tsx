"use client";

import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Sparkles, Image as ImageIcon, Film, LayoutTemplate } from 'lucide-react';
import SingleMediaUploader from '@/components/admin/products/SingleMediaUploader';
import { BLUSHING_BLOOMS_DEFAULTS } from '@/data/blushing-blooms';
import {
  blushingBloomsPageSchema,
  type BlushingBloomsPageFormData,
} from '@/lib/validations/blushing-blooms';

/**
 * Content editor for the Blushing Blooms category page.
 *
 * Rendered only under Category System -> Blushing Blooms, so nothing here is reachable from
 * the other three fixed categories.
 *
 * Every field is optional: the storefront merges this row over the designed defaults, so a
 * blank input shows the placeholder copy on the live page rather than an empty section. The
 * placeholders below are exactly those defaults, so an admin can see what "leave blank" gives.
 */

const inputCls =
  'w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#A83A22]';

/** The form's own empty state — distinct from the storefront defaults, which fill in later. */
const EMPTY: BlushingBloomsPageFormData = {
  heroMedia: '', heroTitle: '', heroSubtitle: '',
  bannerMedia: '', bannerEyebrow: '', bannerTitle: '', bannerTitleAccent: '',
  bannerDescription: '', bannerCtaLabel: '', bannerCtaHref: '',
  videoMedia: '', videoTitle: '', videoTitleAccent: '', videoDescription: '',
};

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-[#A83A22]">
          {icon}
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default function BlushingBloomsPageForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [exists, setExists] = useState(false);

  const methods = useForm<BlushingBloomsPageFormData>({
    resolver: zodResolver(blushingBloomsPageSchema),
    mode: 'onChange',
    defaultValues: EMPTY,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/blushing-blooms');
        const json = await res.json();
        if (active && json?.success && json.data) {
          setExists(true);
          // Null columns become '' so the inputs stay controlled and show their placeholders.
          const next = { ...EMPTY };
          for (const key of Object.keys(EMPTY) as (keyof BlushingBloomsPageFormData)[]) {
            next[key] = json.data[key] ?? '';
          }
          reset(next);
        }
      } catch {
        if (active) toast.error('Failed to load Blushing Blooms content');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reset]);

  const onSubmit = async (data: BlushingBloomsPageFormData) => {
    try {
      const res = await fetch('/api/admin/blushing-blooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Something went wrong');
      setExists(true);
      toast.success('Blushing Blooms page saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="h-5 w-56 rounded skeleton" />
        <div className="h-32 w-full rounded-lg skeleton" />
        <div className="h-10 w-full rounded-lg skeleton" />
        <div className="h-10 w-full rounded-lg skeleton" />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" suppressHydrationWarning>
        <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm text-gray-600">
          Leave any field blank to keep the designed default. Media accepts an image or a video —
          the storefront detects which from the file itself.
        </div>

        <Section
          icon={<Sparkles size={18} />}
          title="Hero"
          hint="The full-screen opening banner and its headline."
        >
          <SingleMediaUploader fieldName="heroMedia" label="Hero image or video" error={errors.heroMedia?.message} />
          <Field label="Heading" error={errors.heroTitle?.message}>
            <input {...register('heroTitle')} placeholder={BLUSHING_BLOOMS_DEFAULTS.heroTitle} className={inputCls} suppressHydrationWarning />
          </Field>
          <Field label="Supporting text" error={errors.heroSubtitle?.message}>
            <textarea {...register('heroSubtitle')} rows={3} placeholder={BLUSHING_BLOOMS_DEFAULTS.heroSubtitle} className={`${inputCls} resize-none`} suppressHydrationWarning />
          </Field>
        </Section>

        <Section
          icon={<LayoutTemplate size={18} />}
          title="Secondary banner"
          hint="The wide gifting banner between the hero and the product grid."
        >
          <SingleMediaUploader fieldName="bannerMedia" label="Banner image or video" error={errors.bannerMedia?.message} />
          <Field label="Eyebrow" error={errors.bannerEyebrow?.message}>
            <input {...register('bannerEyebrow')} placeholder={BLUSHING_BLOOMS_DEFAULTS.bannerEyebrow} className={inputCls} suppressHydrationWarning />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading — first line" error={errors.bannerTitle?.message}>
              <input {...register('bannerTitle')} placeholder={BLUSHING_BLOOMS_DEFAULTS.bannerTitle} className={inputCls} suppressHydrationWarning />
            </Field>
            <Field label="Heading — accent line (pink)" error={errors.bannerTitleAccent?.message}>
              <input {...register('bannerTitleAccent')} placeholder={BLUSHING_BLOOMS_DEFAULTS.bannerTitleAccent} className={inputCls} suppressHydrationWarning />
            </Field>
          </div>
          <Field label="Description" error={errors.bannerDescription?.message}>
            <textarea {...register('bannerDescription')} rows={3} placeholder={BLUSHING_BLOOMS_DEFAULTS.bannerDescription} className={`${inputCls} resize-none`} suppressHydrationWarning />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Button label" error={errors.bannerCtaLabel?.message}>
              <input {...register('bannerCtaLabel')} placeholder={BLUSHING_BLOOMS_DEFAULTS.bannerCtaLabel} className={inputCls} suppressHydrationWarning />
            </Field>
            <Field label="Button link" error={errors.bannerCtaHref?.message}>
              <input {...register('bannerCtaHref')} placeholder={BLUSHING_BLOOMS_DEFAULTS.bannerCtaHref} className={inputCls} suppressHydrationWarning />
            </Field>
          </div>
        </Section>

        <Section
          icon={<Film size={18} />}
          title="Video feature"
          hint="The wide autoplaying clip between the two product rows."
        >
          <SingleMediaUploader fieldName="videoMedia" label="Video (or image)" error={errors.videoMedia?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading — first line" error={errors.videoTitle?.message}>
              <input {...register('videoTitle')} placeholder={BLUSHING_BLOOMS_DEFAULTS.videoTitle} className={inputCls} suppressHydrationWarning />
            </Field>
            <Field label="Heading — accent line (pink)" error={errors.videoTitleAccent?.message}>
              <input {...register('videoTitleAccent')} placeholder={BLUSHING_BLOOMS_DEFAULTS.videoTitleAccent} className={inputCls} suppressHydrationWarning />
            </Field>
          </div>
          <Field label="Description" error={errors.videoDescription?.message}>
            <textarea {...register('videoDescription')} rows={3} placeholder={BLUSHING_BLOOMS_DEFAULTS.videoDescription} className={`${inputCls} resize-none`} suppressHydrationWarning />
          </Field>
        </Section>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#A83A22] px-6 py-2.5 font-medium text-white transition hover:bg-[#8e311d] disabled:cursor-not-allowed disabled:opacity-60"
            suppressHydrationWarning
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {exists ? 'Update page content' : 'Save page content'}
          </button>
          <a
            href="/shop?category=blushing-blooms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-[#A83A22]"
          >
            <ImageIcon size={15} /> Preview page
          </a>
        </div>
      </form>
    </FormProvider>
  );
}
