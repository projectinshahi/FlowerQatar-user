import { z } from "zod";
import { isValidPostalCode } from "@/lib/postal";

/** Generous safety backstop to prevent abuse; users are effectively unlimited. */
export const MAX_ADDRESSES = 100;

const req = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Too long")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const addressSchema = z
  .object({
    label: req("Label", 30),
    countryCode: z.string().trim().min(2, "Country is required").max(3, "Invalid country"),
    countryName: req("Country", 100),
    stateCode: z.string().trim().max(12).optional().nullable().transform((v) => (v ? v : null)),
    stateName: z.string().trim().max(100).optional().nullable().transform((v) => (v ? v : null)),
    city: req("City", 100),
    postalCode: z
      .string()
      .trim()
      .max(12, "Postal code is too long")
      .optional()
      .nullable()
      .transform((v) => (v ? v.trim() : "")),
    addressLine1: req("Address line 1", 255),
    addressLine2: opt(255),
    isDefault: z.boolean().optional().default(false),
  })
  // Postal validation adapts to the selected country (see lib/postal.ts).
  .refine((d) => isValidPostalCode(d.countryCode, d.postalCode || ""), {
    path: ["postalCode"],
    message: "Enter a valid postal code for the selected country",
  });

export type AddressInput = z.infer<typeof addressSchema>;

/** A stored address record (API response) = validated input + server-managed fields. */
export interface Address {
  id: string;
  label: string;
  countryCode: string;
  countryName: string;
  stateCode: string | null;
  stateName: string | null;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}
