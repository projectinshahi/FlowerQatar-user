import { z } from 'zod';

/**
 * Validation for the Blushing Blooms page singleton.
 *
 * One schema drives both the admin form (via zodResolver) and the PUT handler — the client is
 * never the only guard, matching lib/validations/welcome-popup.ts.
 *
 * Every field is optional and an empty string is a legitimate stored value meaning "use the
 * designed default": getBlushingBloomsContent() already treats blank the same as null when it
 * merges the row over the defaults. Keeping input and output both `string | undefined` (rather
 * than coercing "" to null) is what lets react-hook-form infer the form values directly from
 * this schema without a second input/output type.
 */

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`).optional();

/** Absolute URLs (Cloudinary) or root-relative paths, the same rule lib/validations/product.ts uses. */
const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === '' || /^https?:\/\//.test(v) || v.startsWith('/'), message)
    .optional();

export const blushingBloomsPageSchema = z.object({
  heroMedia: optionalUrl('Enter a full URL or a path starting with /'),
  heroTitle: optionalText(80, 'Hero title'),
  heroSubtitle: optionalText(400, 'Hero subtitle'),

  bannerMedia: optionalUrl('Enter a full URL or a path starting with /'),
  bannerEyebrow: optionalText(60, 'Banner eyebrow'),
  bannerTitle: optionalText(80, 'Banner title'),
  bannerTitleAccent: optionalText(80, 'Banner accent line'),
  bannerDescription: optionalText(400, 'Banner description'),
  bannerCtaLabel: optionalText(40, 'Button label'),
  // Anchor (#id), internal path or absolute URL. Rejects "javascript:" by construction.
  bannerCtaHref: z
    .string()
    .trim()
    .max(255)
    .refine(
      (v) => v === '' || v.startsWith('/') || v.startsWith('#') || /^https?:\/\//.test(v),
      'Enter a path starting with / or #, or a full URL'
    )
    .optional(),

  videoMedia: optionalUrl('Enter a full URL or a path starting with /'),
  videoTitle: optionalText(80, 'Video title'),
  videoTitleAccent: optionalText(80, 'Video accent line'),
  videoDescription: optionalText(400, 'Video description'),
});

export type BlushingBloomsPageFormData = z.infer<typeof blushingBloomsPageSchema>;
