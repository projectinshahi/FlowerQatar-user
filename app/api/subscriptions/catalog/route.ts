import { prisma } from "@/lib/prisma";
import { ok, withUser } from "@/lib/api";
import { resolveProduct } from "@/lib/services/subscription/service";

// GET /api/subscriptions/catalog — published products a user can subscribe to (for the create form).
export const GET = withUser(async () => {
  const rows = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true, variants: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const items = rows.map((r) => {
    const p = resolveProduct(r);
    return { id: r.id, name: r.name, price: p.unitPrice, image: p.productImage };
  });
  return ok(items);
});
