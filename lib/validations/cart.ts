import { z } from "zod";

/**
 * Selection carries the raw choices. For catalog products it's only used as a
 * fallback to resolve the variant/color by name and to hold boxColor (which
 * isn't part of the product JSON). For custom arrangements (no productId) it is
 * the source of truth for display.
 */
export const cartSelectionSchema = z
  .object({
    roseColor: z.string().max(100).optional(),
    boxColor: z.string().max(100).optional(),
    boxShape: z.string().max(100).optional(),
    size: z.string().max(100).optional(),
    lid: z.string().max(100).optional(),
    card: z.string().max(500).optional(),
    name: z.string().max(255).optional(),
    slug: z.string().max(255).optional(),
    image: z.string().max(1000).optional(),
    // M05: gift add-ons / delivery / greeting (persisted with the cart line).
    addOns: z.array(z.object({ id: z.string().max(100), name: z.string().max(100), price: z.number() })).max(20).optional(),
    deliveryDate: z.string().max(20).optional(),
    deliveryTime: z.string().max(20).optional(),
    greetingTemplateId: z.string().max(100).optional(),
    greetingMessage: z.string().max(500).optional(),
    greetingStyle: z
      .object({
        color: z.string().max(20),
        font: z.enum(["serif", "script", "sans"]),
        size: z.enum(["sm", "md", "lg"]),
      })
      .optional(),
    calculatedPrice: z.number().optional(),
  })
  .partial()
  .optional()
  .nullable();

export const addItemSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  variantId: z.string().max(100).optional().nullable(), // Product.variants[].id (JSON)
  colorId: z.string().max(100).optional().nullable(), // Product.variants[].colorVariants[].id (JSON)
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(99),
  unitPrice: z.coerce.number().min(0, "Price must be 0 or greater"),
  selection: cartSelectionSchema,
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative").max(99),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CartSelection = z.infer<typeof cartSelectionSchema>;
