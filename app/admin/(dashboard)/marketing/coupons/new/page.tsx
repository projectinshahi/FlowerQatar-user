import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTargetOptions } from "@/lib/marketing-options";
import CouponForm from "@/components/admin/marketing/CouponForm";

export const metadata = { title: "New Coupon | Marketing" };

export default async function NewCouponPage() {
  const { productOptions, categoryOptions } = await getTargetOptions();

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing/coupons" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">New Coupon</h1>
          <p className="text-gray-500 text-sm">Create a discount coupon.</p>
        </div>
      </div>
      <CouponForm productOptions={productOptions} categoryOptions={categoryOptions} />
    </div>
  );
}
