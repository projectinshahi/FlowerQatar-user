import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CATEGORY_ORDER, CATEGORY_META, CATEGORY_FEATURES, categorySlug } from '@/lib/subcategories';
import type { CategoryType } from '@prisma/client';
import { Gift, CalendarHeart, Cake, Flower2, Gem, Compass, ChevronRight, Lock } from 'lucide-react';

export const metadata = { title: 'Category System | Admin' };
export const dynamic = 'force-dynamic';

const ICONS: Record<CategoryType, typeof Gift> = {
  GIFT_COMBOS: Gift,
  SHOP_BY_OCCASION: CalendarHeart,
  BIRTHDAY: Cake,
  FLOWER: Flower2,
  LUXURY_GIFTS: Gem,
  EXPLORE: Compass,
};

// Short helper line describing what each category holds.
const BLURB: Record<CategoryType, string> = {
  GIFT_COMBOS: 'Combo bundles — cake, flower, chocolate and more.',
  SHOP_BY_OCCASION: 'Occasion collections shoppers browse by moment.',
  BIRTHDAY: 'Birthday gifting, grouped by recipient.',
  FLOWER: 'Flower types — powers the mega-menu & home garden.',
  LUXURY_GIFTS: 'Premium and luxury gift ranges.',
  EXPLORE: 'Explore tiles — cake, perfume, toys and beyond.',
};

export default async function CategorySystemPage() {
  const grouped = await prisma.subcategory.groupBy({
    by: ['categoryType'],
    _count: { _all: true },
    where: { active: true },
  });
  const counts = new Map(grouped.map((g) => [g.categoryType, g._count._all]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Category System</h1>
        <p className="text-gray-500 mt-1">
          Six fixed categories. You manage the subcategories inside each — the categories themselves are
          permanent and cannot be added, renamed, or removed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORY_ORDER.map((type) => {
          const Icon = ICONS[type];
          const meta = CATEGORY_META[type];
          const features = CATEGORY_FEATURES[type];
          const count = counts.get(type) ?? 0;
          return (
            <Link
              key={type}
              href={`/admin/category-system/${categorySlug(type)}`}
              className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#A83A22]/30 transition-all"
            >
              <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                <Lock className="w-3 h-3" /> Fixed
              </span>
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#A83A22] flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{meta.label}</h2>
              <p className="text-sm text-gray-500 mt-1 min-h-[40px]">{BLURB[type]}</p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-gray-900 text-white text-sm font-semibold">
                    {count}
                  </span>
                  <span className="text-sm text-gray-500">subcategories</span>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-[#A83A22] group-hover:gap-2 transition-all">
                  Manage <ChevronRight className="w-4 h-4" />
                </span>
              </div>

              {(features.image || features.explore) && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {features.image && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                      Images
                    </span>
                  )}
                  {features.explore && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Home garden
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
