import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PromotionForm from "@/components/admin/marketing/PromotionForm";

export const metadata = { title: "New Promotion | Marketing" };

export default function NewPromotionPage() {
  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing/promotions" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">New Promotion</h1>
          <p className="text-gray-500 text-sm">Create a promotional campaign.</p>
        </div>
      </div>
      <PromotionForm />
    </div>
  );
}
