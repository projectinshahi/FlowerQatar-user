import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address")
  // The DB column is VarChar(255); 254 is the RFC 5321 maximum. Without this a longer address
  // passed validation and failed at the database as an unexplained 500.
  .max(254, "Email address is too long");
const name = (label: string) => z.string().trim().min(1, `${label} is required`).max(50, `${label} is too long`);

export const sendOtpSchema = z.object({
  firstName: name("First name"),
  lastName: name("Last name"),
  email,
});

export const resendOtpSchema = z.object({
  email,
  firstName: z.string().trim().max(50).optional(),
});

export const verifyOtpSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

// Password policy: 8+ chars, upper, lower, number, special.
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  // bcrypt silently ignores everything past 72 bytes, so a longer password would be accepted
  // at sign-up and then "work" with only its first 72 bytes. Reject it instead of truncating.
  .max(72, "At most 72 characters")
  .regex(/[A-Z]/, "One uppercase letter")
  .regex(/[a-z]/, "One lowercase letter")
  .regex(/[0-9]/, "One number")
  .regex(/[^A-Za-z0-9]/, "One special character");

export const createAccountSchema = z
  .object({
    token: z.string().min(1, "Verification token is required"),
    firstName: name("First name"),
    lastName: name("Last name"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });


/* ─────────────── Forgot password ─────────────── */

export const forgotPasswordSchema = z.object({ email });

/** The reset step: the emailed code plus the new password, held to the same policy as sign-up. */
export const resetPasswordSchema = z
  .object({
    email,
    otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
