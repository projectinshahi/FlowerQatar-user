import { getCoupons } from "@/lib/actions/marketing.actions";
import CouponsClient from "@/components/admin/marketing/CouponsClient";

export const metadata = { title: "Coupons | Marketing" };

export default async function CouponsPage({
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
    type: str("type") as any,
    usage: str("usage") as any,
    sortBy: str("sortBy") as any,
    page: str("page") ? Number(str("page")) : 1,
    limit: 10,
  };

  const res = await getCoupons(params);

  if (!res.success) {
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{res.error}</div>;
  }

  const rawParams: Record<string, string> = {};
  ["search", "status", "state", "type", "usage", "sortBy"].forEach((k) => {
    const v = str(k);
    if (v) rawParams[k] = v;
  });

  return <CouponsClient coupons={res.data.coupons} pagination={res.data.pagination} params={rawParams} />;
}
