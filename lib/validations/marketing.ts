import { z } from "zod";

/* ─────────────────────────── Enums ─────────────────────────── */

export const DISCOUNT_TYPES = ["FLAT", "PERCENTAGE"] as const;
export const OFFER_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export const PROMOTION_TYPES = [
  "FESTIVAL",
  "WEEKEND",
  "FLASH_SALE",
  "SEASON_SALE",
  "BIRTHDAY",
  "ANNIVERSARY",
  "CHRISTMAS",
  "NEW_YEAR",
  "DIWALI",
  "EID",
  "BLACK_FRIDAY",
  "CYBER_MONDAY",
  "CUSTOM",
] as const;

/* ───────────────────────── Helpers ─────────────────────────── */

const optionalPositiveInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number({ error: "Must be a number" }).int("Must be a whole number").min(1, "Must be at least 1").nullable()
);

const optionalMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number({ error: "Must be a number" }).min(0, "Must be 0 or greater").nullable()
);

const requiredMoney = (label: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: `${label} is required` }).min(0, `${label} must be 0 or greater`)
  );

const idArray = z.array(z.string().uuid()).default([]);

/* ───────────────────────── Coupon ──────────────────────────── */

export const couponSchema = z
  .object({
    id: z.string().optional(),
    // Optional — auto-generated server-side when left blank.
    code: z
      .string()
      .max(50, "Coupon code is too long")
      .optional()
      .transform((v) => (v ? v.trim().toUpperCase() : undefined)),
    name: z.string().min(1, "Coupon name is required").max(255),
    description: z.string().optional().nullable(),
    type: z.enum(DISCOUNT_TYPES),
    discountValue: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number({ error: "Discount is required" }).positive("Discount must be positive")
    ),
    maxDiscount: optionalMoney,
    minOrderAmount: requiredMoney("Minimum order").default(0),
    usageLimit: optionalPositiveInt,
    usagePerCustomer: optionalPositiveInt,
    startDate: z.coerce.date({ error: "Start date is required" }),
    endDate: z.coerce.date({ error: "End date is required" }),
    autoApply: z.boolean().default(false),
    freeDelivery: z.boolean().default(false),
    status: z.enum(OFFER_STATUSES).default("ACTIVE"),
    priority: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? 0 : Number(v)),
      z.number().int().min(0).default(0)
    ),
    applicableCategories: idArray,
    applicableProducts: idArray,
    excludedProducts: idArray,
    excludedCategories: idArray,
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((d) => d.type !== "PERCENTAGE" || d.discountValue <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["discountValue"],
  });

export type CouponFormValues = z.infer<typeof couponSchema>;

/* ─────────────────────── Promotion ─────────────────────────── */

export const promotionSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1, "Title is required").max(255),
    description: z.string().optional().nullable(),
    promotionType: z.enum(PROMOTION_TYPES),
    banner: z.string().url("Invalid banner URL").optional().nullable().or(z.literal("")),
    bannerPublicId: z.string().optional().nullable(),
    startDate: z.coerce.date({ error: "Start date is required" }),
    endDate: z.coerce.date({ error: "End date is required" }),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number({ error: "Discount is required" }).positive("Discount must be positive")
    ),
    maxDiscount: optionalMoney,
    autoApply: z.boolean().default(true),
    status: z.enum(OFFER_STATUSES).default("ACTIVE"),
    priority: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? 0 : Number(v)),
      z.number().int().min(0).default(0)
    ),
    applicableCategories: idArray,
    applicableProducts: idArray,
    excludedProducts: idArray,
    excludedCategories: idArray,
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((d) => d.discountType !== "PERCENTAGE" || d.discountValue <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["discountValue"],
  });

export type PromotionFormValues = z.infer<typeof promotionSchema>;

/* ──────────────────── Free Delivery Campaign ───────────────── */

export const freeDeliverySchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Campaign name is required").max(255),
    minOrderAmount: requiredMoney("Minimum order").default(0),
    startDate: z.coerce.date({ error: "Start date is required" }),
    endDate: z.coerce.date({ error: "End date is required" }),
    status: z.enum(OFFER_STATUSES).default("ACTIVE"),
    priority: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? 0 : Number(v)),
      z.number().int().min(0).default(0)
    ),
    applicableCategories: idArray,
    applicableProducts: idArray,
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type FreeDeliveryFormValues = z.infer<typeof freeDeliverySchema>;

/* ─────────────────── Checkout / Storefront DTOs ────────────── */

export const cartItemSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
  quantity: z.coerce.number().int().min(1),
  price: z.coerce.number().min(0),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").transform((v) => v.trim().toUpperCase()),
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
});

export const applyCouponSchema = validateCouponSchema.extend({
  orderId: z.string().uuid().optional().nullable(),
});

export const cartOnlySchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
});

export type CartItemDTO = z.infer<typeof cartItemSchema>;
