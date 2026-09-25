import { z } from "zod";

export const FREQUENCIES = [
  "DAILY",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "EVERY_X_DAYS",
  "EVERY_X_WEEKS",
  "EVERY_X_MONTHS",
  "SPECIFIC_WEEKDAY",
  "SPECIFIC_MONTH_DATE",
] as const;

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .refine((v) => !isNaN(new Date(v).getTime()), "Enter a valid date");

export const createSubscriptionSchema = z
  .object({
    productId: z.string().uuid("Invalid product"),
    variantId: z.string().max(100).optional().nullable(),
    colorId: z.string().max(100).optional().nullable(),
    quantity: z.number().int().min(1, "Minimum quantity is 1").max(99, "Maximum quantity is 99"),
    frequency: z.enum(FREQUENCIES),
    intervalCount: z.number().int().min(1).max(365).default(1),
    weekday: z.number().int().min(0).max(6).optional().nullable(),
    monthDate: z.number().int().min(1).max(31).optional().nullable(),
    // null / omitted => unlimited
    totalDeliveries: z.number().int().min(1).max(52).optional().nullable(),
    startDate: dateString,
    addressId: z.string().optional().nullable(),
  })
  .refine((d) => d.frequency !== "SPECIFIC_WEEKDAY" || d.weekday != null, {
    path: ["weekday"],
    message: "Choose a weekday",
  })
  .refine((d) => d.frequency !== "SPECIFIC_MONTH_DATE" || d.monthDate != null, {
    path: ["monthDate"],
    message: "Choose a day of the month",
  })
  .refine(
    (d) => {
      const today = new Date();
      const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      return new Date(d.startDate + "T00:00:00Z") >= t;
    },
    { path: ["startDate"], message: "Start date cannot be in the past" }
  );

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const pauseSubscriptionSchema = z.object({
  resumeDate: dateString.optional().nullable(),
  reason: z.string().trim().max(300).optional().nullable(),
});
export type PauseSubscriptionInput = z.infer<typeof pauseSubscriptionSchema>;

export const skipDeliverySchema = z.object({
  deliveryId: z.string().uuid().optional().nullable(),
});
export type SkipDeliveryInput = z.infer<typeof skipDeliverySchema>;

export const cancelSubscriptionSchema = z.object({
  reason: z.string().trim().max(300).optional().nullable(),
});
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
