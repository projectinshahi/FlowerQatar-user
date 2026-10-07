import { z } from "zod";
import { ZONE_PATTERN, formatQatarAddress, normalizeQatarMobile } from "@/lib/qatar";

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

/**
 * A Qatari mobile, in any usual form ("5512 3456", "+974 5512 3456"), stored as +974XXXXXXXX
 * so couriers and the payment gateway always get one format. Used by the order API.
 */
export const qatarMobile = z
  .string()
  .max(40)
  .transform((v, ctx) => {
    const phone = normalizeQatarMobile(v);
    if (!phone) ctx.addIssue({ code: "custom", message: "Enter a valid Qatar mobile number: 8 digits starting with 3, 5, 6 or 7" });
    return phone ?? "";
  });

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
