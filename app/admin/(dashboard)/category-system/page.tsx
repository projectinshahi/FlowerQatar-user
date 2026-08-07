import Link from 'next/link';
import { FolderTree, ChevronRight } from 'lucide-react';
import { FIXED_CATEGORY_TYPES, fixedCategoryLabel } from '@/lib/category-config';

export const metadata = { title: 'Category System | Admin' };
export const dynamic = 'force-dynamic';

export default function CategorySystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Category System</h1>
        <p className="mt-1 text-gray-500">Fixed parent categories. Open one to add and manage its subcategories.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIXED_CATEGORY_TYPES.map((category) => (
          <Link key={category} href={`/admin/category-system/${category}`} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-[#A83A22]/30 hover:shadow-md">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#A83A22]"><FolderTree className="h-5 w-5" /></div>
            <h2 className="font-semibold text-gray-900">{fixedCategoryLabel(category)}</h2>
            <p className="mt-1 text-sm text-gray-500">Manage subcategories and hover images.</p>
            <span className="mt-4 flex items-center gap-1 text-sm font-medium text-[#A83A22] transition group-hover:gap-2">Manage <ChevronRight className="h-4 w-4" /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
