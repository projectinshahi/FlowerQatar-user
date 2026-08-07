import { prisma } from '@/lib/prisma';

/** Product and active-subcategory choices used by marketing targeting forms. */
export async function getTargetOptions() {
  const [products, subcategories] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 1000 }),
    prisma.subcategory.findMany({ where: { isActive: true, category: { isActive: true } }, select: { id: true, name: true, category: { select: { name: true } } }, orderBy: { name: 'asc' } }),
  ]);
  return { productOptions: products.map((p) => ({ value: p.id, label: p.name })), categoryOptions: subcategories.map((s) => ({ value: s.id, label: `${s.category.name} › ${s.name}` })) };
}
