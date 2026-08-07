import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FolderTree } from 'lucide-react';
import SubcategoryManager from '@/components/admin/subcategories/SubcategoryManager';
import { FIXED_CATEGORY_TYPES, fixedCategoryLabel } from '@/lib/category-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return { title: `${fixedCategoryLabel(category)} Subcategories | Admin` };
}

export default async function CategorySubcategoriesPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!FIXED_CATEGORY_TYPES.includes(category as (typeof FIXED_CATEGORY_TYPES)[number])) notFound();
  const label = fixedCategoryLabel(category);
  return (
    <div className="space-y-6">
      <Link href="/admin/category-system" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-[#A83A22]"><ChevronLeft className="h-4 w-4" />All categories</Link>
      <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
        <div className="rounded-xl bg-white p-2.5 text-[#A83A22] shadow-sm"><FolderTree className="h-5 w-5" /></div>
        <div><h1 className="font-serif text-2xl font-bold text-gray-900">{label} Subcategories</h1><p className="mt-1 text-sm text-gray-600">Add, edit, search, and manage hover images for {label} subcategories.</p></div>
      </div>
      <SubcategoryManager fixedCategoryName={category} />
    </div>
  );
}
