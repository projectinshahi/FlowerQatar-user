import { ok, withHandler } from "@/lib/api/handler";
import { readQuery, writeQuery } from "@/lib/db";
import { CartItem } from "@/store/cartStore";

export const POST = withHandler(
  async ({ req, user }) => {
    const body = await req.json();
    const incoming: CartItem[] = body.items || [];
    const userId = user.id as string;

    const keyOf = (i: any) =>
      `${i.product_id}_${i.size ?? ""}_${i.thickness ?? ""}_${i.mounting_method ?? ""}_${i.orientation ?? ""}_${i.variant_id ?? ""}`;

    // Get existing DB cart for this user
    const existing = await readQuery<any>(
      `SELECT * FROM cart_items WHERE user_id = $1`,
      [userId]
    );

    const existingMap = new Map(existing.map((i: any) => [keyOf(i), i]));
    const incomingMap = new Map(incoming.map((i) => [keyOf(i), i]));

    const toInsert: CartItem[] = [];
    const toUpdate: CartItem[] = [];
    const toDelete: any[] = [];

    for (const item of incoming) {
      const key = keyOf(item);
      const existingItem = existingMap.get(key);
      if (!existingItem) {
        toInsert.push(item);
      } else if (Number(existingItem.quantity) !== Number(item.quantity)) {
        toUpdate.push(item);
      }
    }

    for (const existingItem of existing) {
      if (!incomingMap.has(keyOf(existingItem))) {
        toDelete.push(existingItem);
      }
    }

    // DELETES
    for (const item of toDelete) {
      await writeQuery(
        `DELETE FROM cart_items
         WHERE user_id = $1
           AND product_id = $2
           AND size = $3
           AND thickness = $4
           AND mounting_method = $5
           AND orientation = $6
           AND (variant_id = $7 OR (variant_id IS NULL AND $7 IS NULL))`,
        [userId, item.product_id, item.size ?? "", item.thickness ?? "",
         item.mounting_method ?? "", item.orientation ?? "", item.variant_id ?? null]
      );
    }

    // INSERTS — use ON CONFLICT to handle duplicates safely
    for (const item of toInsert) {
      await writeQuery(
        `INSERT INTO cart_items
           (user_id, product_id, size, thickness, mounting_method, orientation, variant_id, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, product_id, size, thickness, mounting_method, orientation, variant_id)
         DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()`,
        [
          userId,
          Number(item.product_id),
          item.size ?? "",
          item.thickness ?? "",
          item.mounting_method ?? "",
          item.orientation ?? "",
          item.variant_id ?? null,
          Number(item.quantity),
        ]
      );
    }

    // UPDATES
    for (const item of toUpdate) {
      await writeQuery(
        `UPDATE cart_items
         SET quantity = $1, updated_at = NOW()
         WHERE user_id = $2
           AND product_id = $3
           AND size = $4
           AND thickness = $5
           AND mounting_method = $6
           AND orientation = $7
           AND (variant_id = $8 OR (variant_id IS NULL AND $8 IS NULL))`,
        [
          Number(item.quantity),
          userId,
          Number(item.product_id),
          item.size ?? "",
          item.thickness ?? "",
          item.mounting_method ?? "",
          item.orientation ?? "",
          item.variant_id ?? null,
        ]
      );
    }

    return ok({ inserted: toInsert.length, updated: toUpdate.length, deleted: toDelete.length });
  },
  { access: "user" }
);
