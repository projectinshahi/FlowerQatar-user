import { z } from "zod";
import { ZONE_PATTERN, formatQatarAddress } from "@/lib/qatar";

/** Generous safety backstop to prevent abuse; users are effectively unlimited. */
export const MAX_ADDRESSES = 100;

/** We deliver within Qatar only, so the country is set server-side, never taken from input. */
export const ADDRESS_COUNTRY = { code: "QA", name: "Qatar" } as const;

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

/** Qatar's national address (the blue plate on every building): zone, street, building. */
export const addressSchema = z.object({
  label: req("Label", 30),
  zone: z.string().trim().regex(ZONE_PATTERN, "Enter your zone number (e.g. 66)"),
  street: req("Street", 100),
  building: req("Building", 50),
  unit: opt(30),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

/** A stored address record (API response) = validated input + server-managed fields. */
export interface Address {
  id: string;
  label: string;
  countryCode: string;
  countryName: string;
  zone: string;
  street: string;
  building: string;
  unit: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Addresses saved before the Qatar format carry these instead of zone/street/building.
  city?: string;
  stateName?: string | null;
  postalCode?: string;
  addressLine1?: string;
  addressLine2?: string | null;
}

/** One-line address for display; falls back to the old fields for addresses saved before. */
export function formatAddress(a: Address): string {
  if (a.zone) return formatQatarAddress(a);
  return [a.addressLine1, a.addressLine2, a.city, a.stateName, a.postalCode].filter(Boolean).join(", ");
}
