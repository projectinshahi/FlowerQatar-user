import { prisma } from "@/lib/prisma";

/**
 * Loads product & category options for the marketing targeting multi-selects.
 * Server-only helper used by the admin form pages.
 */
export async function getTargetOptions() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 1000 }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    productOptions: products.map((p) => ({ value: p.id, label: p.name })),
    categoryOptions: categories.map((c) => ({ value: c.id, label: c.name })),
  };
}
