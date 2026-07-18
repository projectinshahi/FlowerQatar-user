import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTargetOptions } from "@/lib/marketing-options";
import CampaignForm from "@/components/admin/marketing/CampaignForm";

export const metadata = { title: "New Campaign | Marketing" };

export default async function NewCampaignPage() {
  const { productOptions, categoryOptions } = await getTargetOptions();

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing/free-delivery" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">New Campaign</h1>
          <p className="text-gray-500 text-sm">Create a free delivery campaign.</p>
        </div>
      </div>
      <CampaignForm productOptions={productOptions} categoryOptions={categoryOptions} />
    </div>
  );
}
