'use client';
// TEMPORARY QA harness (deleted after measuring): real admin tables in the real AdminShell,
// fed synthetic rows. Client-fetched lists get their data from the test browser's mocks.
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import OccasionList from '@/components/admin/occasions/OccasionList';
import GiftGroupManager from '@/components/admin/gift-groups/GiftGroupManager';
import SubcategoryManager from '@/components/admin/subcategories/SubcategoryManager';
import ProductTable from '@/components/admin/products/ProductTable';
import CouponsClient from '@/components/admin/marketing/CouponsClient';
import PromotionsClient from '@/components/admin/marketing/PromotionsClient';
import CampaignsClient from '@/components/admin/marketing/CampaignsClient';

const d = (n: number) => new Date(Date.UTC(2026, 9, 1 + n)).toISOString();
const pg = { total: 3, page: 1, limit: 20, totalPages: 1 };
const three = [1, 2, 3];
const products = three.map((i) => ({
  id: `p${i}`, slug: `p-${i}`, name: `Eternal Rose Signature Box ${i}`, sku: `LEB-ROSE-00${i}`, country: 'Qatar', status: 'PUBLISHED',
  variants: [{ colorVariants: [{ colorName: 'Red', price: 450, salePrice: i === 1 ? 399 : null, galleryImages: [] }, { colorName: 'Pink', price: 520, salePrice: null, galleryImages: [] }] }],
  subcategory: { name: 'Preserved Roses' }, isFeatured: i === 1, isBestSeller: i === 2,
}));
const coupons = three.map((i) => ({
  id: `c${i}`, code: `NATIONALDAY${i}5`, name: `National Day Celebration ${i}`, type: 'PERCENTAGE', discountValue: 15, maxDiscount: 100,
  freeDelivery: i === 2, autoApply: i === 3, currentUsage: 12, usageLimit: 500, startDate: d(0), endDate: d(60), status: 'ACTIVE', state: 'ACTIVE',
}));
const promotions = three.map((i) => ({
  id: `pr${i}`, title: `Valentine Week Bouquet Offer ${i}`, promotionType: 'CATEGORY_DISCOUNT', discountType: 'PERCENTAGE', discountValue: 10,
  maxDiscount: 50, priority: i, autoApply: true, startDate: d(0), endDate: d(30), status: 'ACTIVE', state: 'ACTIVE',
}));
const campaigns = three.map((i) => ({
  id: `fd${i}`, name: `Free Delivery Weekend ${i}`, minOrderAmount: 300, priority: i, startDate: d(0), endDate: d(14), status: 'ACTIVE', state: 'ACTIVE',
}));

function Pick() {
  const c = useSearchParams().get('c');
  /* eslint-disable @typescript-eslint/no-explicit-any -- synthetic fixtures, file is deleted after QA */
  if (c === 'occasions') return <OccasionList />;
  if (c === 'gift-groups') return <GiftGroupManager />;
  if (c === 'subcategories') return <SubcategoryManager fixedCategoryName="Flowers" />;
  if (c === 'products') return <ProductTable products={products} pagination={pg} />;
  if (c === 'coupons') return <CouponsClient coupons={coupons as any} pagination={pg} params={{}} />;
  if (c === 'promotions') return <PromotionsClient promotions={promotions as any} pagination={pg} params={{}} />;
  if (c === 'campaigns') return <CampaignsClient campaigns={campaigns as any} pagination={pg} params={{}} />;
  return <p>?c=occasions|gift-groups|subcategories|products|coupons|promotions|campaigns</p>;
}

export default function QaHarness() {
  return (
    <AdminShell>
      <Suspense>
        <Pick />
      </Suspense>
    </AdminShell>
  );
}
