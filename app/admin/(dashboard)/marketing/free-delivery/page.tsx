import { getCampaigns } from "@/lib/actions/marketing.actions";
import CampaignsClient from "@/components/admin/marketing/CampaignsClient";

export const metadata = { title: "Free Delivery | Marketing" };

export default async function FreeDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const params = {
    search: str("search"),
    status: str("status") as any,
    state: str("state") as any,
    page: str("page") ? Number(str("page")) : 1,
    limit: 10,
  };

  const res = await getCampaigns(params);

  if (!res.success) {
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{res.error}</div>;
  }

  const rawParams: Record<string, string> = {};
  ["search", "status", "state"].forEach((k) => {
    const v = str(k);
    if (v) rawParams[k] = v;
  });

  return <CampaignsClient campaigns={res.data.campaigns} pagination={res.data.pagination} params={rawParams} />;
}
