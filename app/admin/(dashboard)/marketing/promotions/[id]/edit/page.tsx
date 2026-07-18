import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPromotionById } from "@/lib/actions/marketing.actions";
import { getTargetOptions } from "@/lib/marketing-options";
import PromotionForm from "@/components/admin/marketing/PromotionForm";

export const metadata = { title: "Edit Promotion | Marketing" };

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [res, { productOptions, categoryOptions }] = await Promise.all([getPromotionById(id), getTargetOptions()]);

  if (!res.success || !res.data) notFound();

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing/promotions" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Edit Promotion</h1>
          <p className="text-gray-500 text-sm">{res.data.title}</p>
        </div>
      </div>
      <PromotionForm productOptions={productOptions} categoryOptions={categoryOptions} initialData={res.data} />
    </div>
  );
}
