import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Please enter a valid email address");
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

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
