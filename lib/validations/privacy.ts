import { z } from "zod";

/** Partial consent update — only the toggled keys are sent. */
export const consentSchema = z.object({
  marketingEmails: z.boolean().optional(),
  promotionalNotifications: z.boolean().optional(),
  analyticsCookies: z.boolean().optional(),
  personalization: z.boolean().optional(),
});

/**
 * Account deletion confirmation. Password-based accounts must send `password`;
 * social-only accounts (no password) must send `confirmText` equal to their email.
 */
export const deleteAccountSchema = z.object({
  password: z.string().optional().nullable(),
  confirmText: z.string().optional().nullable(),
});
