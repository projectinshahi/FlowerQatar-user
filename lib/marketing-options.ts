import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/category-config";

/**
 * Loads product & subcategory options for the marketing targeting multi-selects.
 * "Categories" here are the new subcategories (prefixed with their fixed parent for
 * clarity); the stored applicable/excluded arrays now hold subcategory ids.
 * Server-only helper used by the admin form pages.
 */
export async function getTargetOptions() {
  const [products, subcategories] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 1000 }),
    prisma.subcategory.findMany({
      where: { active: true },
      select: { id: true, name: true, categoryType: true },
      orderBy: [{ categoryType: "asc" }, { pinned: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  return {
    productOptions: products.map((p) => ({ value: p.id, label: p.name })),
    categoryOptions: subcategories.map((c) => ({
      value: c.id,
      label: `${CATEGORY_META[c.categoryType].label} › ${c.name}`,
    })),
  };
}
