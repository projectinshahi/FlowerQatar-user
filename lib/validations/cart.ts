import { z } from "zod";
import { isValidDeliveryDate, isValidSlot } from "@/lib/delivery";
import { MAX_CART_QUANTITY } from "@/lib/cart-limits";

/**
 * Selection carries the raw choices. For catalog products it's only used as a
 * fallback to resolve the variant/color by name and to hold boxColor (which
 * isn't part of the product JSON). For custom arrangements (no productId) it is
 * the source of truth for display.
 */
/**
 * Fonts a greeting message can be set in.
 *
 * "serif" | "script" | "sans" are the original three. The named faces below were added for the
 * Blushing Blooms quick view, which lets the customer pick the typeface their wish is printed
 * in. (The design's fifth face, Gveret Levin AlefAlefAlef, is not in next/font/google's
 * catalogue, so Montez — the nearest available script — stands in for it.)
 * Widening rather than replacing: every previously stored value still validates, and until
 * now only "serif" was ever sent (the picker on the product page is commented out), so no
 * existing cart line can be affected.
 *
 * This is the one place the union is declared — AppContext and GreetingCardSelector import the
 * type from here so the client and the server can never disagree about what is storable.
 */
export const GREETING_FONTS = [
  "serif",
  "script",
  "sans",
  "montecarlo",
  "nothing-you-could-do",
  "marck-script",
  "poltawski-nowy",
  "montez",
  "galada",
] as const;

export type GreetingFont = (typeof GREETING_FONTS)[number];

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
        font: z.enum(GREETING_FONTS),
        size: z.enum(["sm", "md", "lg"]),
      })
      .optional(),
    calculatedPrice: z.number().optional(),
  })
  .partial()
  .refine((s) => !s?.deliveryDate || isValidDeliveryDate(s.deliveryDate), {
    path: ["deliveryDate"],
    message: "Choose an available delivery date",
  })
  .refine((s) => !s?.deliveryTime || (!!s.deliveryDate && isValidSlot(s.deliveryDate, s.deliveryTime)), {
    path: ["deliveryTime"],
    message: "Choose an available delivery time",
  })
  .optional()
  .nullable();


export const addItemSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  variantId: z.string().max(100).optional().nullable(), // Product.variants[].id (JSON)
  colorId: z.string().max(100).optional().nullable(), // Product.variants[].colorVariants[].id (JSON)
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(MAX_CART_QUANTITY),
  unitPrice: z.coerce.number().min(0, "Price must be 0 or greater"),
  selection: cartSelectionSchema,
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative").max(MAX_CART_QUANTITY),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CartSelection = z.infer<typeof cartSelectionSchema>;
