import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCampaignById } from "@/lib/actions/marketing.actions";
import { getTargetOptions } from "@/lib/marketing-options";
import CampaignForm from "@/components/admin/marketing/CampaignForm";

export const metadata = { title: "Edit Campaign | Marketing" };

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [res, { productOptions, categoryOptions }] = await Promise.all([getCampaignById(id), getTargetOptions()]);

  if (!res.success || !res.data) notFound();

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing/free-delivery" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Edit Campaign</h1>
          <p className="text-gray-500 text-sm">{res.data.name}</p>
        </div>
      </div>
      <CampaignForm productOptions={productOptions} categoryOptions={categoryOptions} initialData={res.data} />
    </div>
  );
}
