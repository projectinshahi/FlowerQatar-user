import { getPromotions } from "@/lib/actions/marketing.actions";
import PromotionsClient from "@/components/admin/marketing/PromotionsClient";
import PromotionBarTheme from "@/components/admin/marketing/PromotionBarTheme";

export const metadata = { title: "Promotions | Marketing" };

export default async function PromotionsPage({
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
    promotionType: str("promotionType") as any,
    page: str("page") ? Number(str("page")) : 1,
    limit: 10,
  };

  const res = await getPromotions(params);

  if (!res.success) {
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{res.error}</div>;
  }

  const rawParams: Record<string, string> = {};
  ["search", "status", "state", "promotionType"].forEach((k) => {
    const v = str(k);
    if (v) rawParams[k] = v;
  });

  return (
    <div className="space-y-6">
      {/* The bar's colours are site-wide, not per-promotion, so they live above the list. */}
      <PromotionBarTheme />
      <PromotionsClient promotions={res.data.promotions} pagination={res.data.pagination} params={rawParams} />
    </div>
  );
}
