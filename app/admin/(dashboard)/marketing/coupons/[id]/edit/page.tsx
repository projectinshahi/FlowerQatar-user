import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCouponById } from "@/lib/actions/marketing.actions";
import { getTargetOptions } from "@/lib/marketing-options";
import CouponForm from "@/components/admin/marketing/CouponForm";

export const metadata = { title: "Edit Coupon | Marketing" };

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [res, { productOptions, categoryOptions }] = await Promise.all([getCouponById(id), getTargetOptions()]);

  if (!res.success || !res.data) notFound();

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing/coupons" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Edit Coupon</h1>
          <p className="text-gray-500 text-sm font-mono">{res.data.code}</p>
        </div>
      </div>
      <CouponForm productOptions={productOptions} categoryOptions={categoryOptions} initialData={res.data} />
    </div>
  );
}
