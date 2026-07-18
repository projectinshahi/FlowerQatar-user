import { z } from 'zod';

/**
 * Validation for the storefront welcome-popup singleton. One schema validates the
 * admin form (via zodResolver) and the PUT request — the client is never the only guard.
 */
export const welcomePopupSchema = z.object({
  heading: z
    .string()
    .min(1, 'Heading is required')
    .max(100, 'Heading must be at most 100 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(400, 'Description must be at most 400 characters')
    .trim(),
});

export type WelcomePopupFormData = z.infer<typeof welcomePopupSchema>;
