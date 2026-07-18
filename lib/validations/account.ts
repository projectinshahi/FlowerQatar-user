import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { passwordSchema } from "./register";

// E.164 phone, validated for every country via libphonenumber-js. Empty -> null.
const optionalE164Phone = z
  .union([z.string().trim(), z.literal("")])
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isValidPhoneNumber(v), { message: "Enter a valid phone number" });

// Cloudinary/remote https URL or empty.
const imageUrl = z
  .union([z.string().trim().url("Invalid image URL"), z.literal("")])
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

/* ───────────────────────── Profile ───────────────────────── */

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name is too long"),
  phone: optionalE164Phone,
  profileImage: imageUrl,
  // Accept a YYYY-MM-DD string; must be a real past date within a sane range.
  dateOfBirth: z
    .union([z.string().trim(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => {
        if (!v) return true;
        const d = new Date(v);
        if (isNaN(d.getTime())) return false;
        return d < new Date() && d > new Date("1900-01-01");
      },
      { message: "Enter a valid date of birth" }
    ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/* ─────────────────────── Change password ─────────────────────── */

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Address validation/types now live in ./address (label + country/state/city codes).
