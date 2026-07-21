import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { categoryFromSlug, CATEGORY_META, CATEGORY_FEATURES } from '@/lib/subcategories';
import SubcategoryManager from '@/components/admin/subcategories/SubcategoryManager';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const type = categoryFromSlug(category);
  return { title: type ? `${CATEGORY_META[type].label} · Category System | Admin` : 'Category System | Admin' };
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const type = categoryFromSlug(category);
  if (!type) notFound();

  const meta = CATEGORY_META[type];
  const features = CATEGORY_FEATURES[type];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/admin/category-system" className="hover:text-[#A83A22] transition-colors">
          Category System
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span className="text-gray-900 font-medium">{meta.label}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">{meta.label} — Subcategories</h1>
        <p className="text-gray-500 mt-1">
          Drag to reorder, toggle visibility, and manage the subcategories shown under{' '}
          <span className="font-mono text-gray-700">{meta.base}</span>.
        </p>
      </div>

      <SubcategoryManager categoryType={type} features={features} />
    </div>
  );
}
