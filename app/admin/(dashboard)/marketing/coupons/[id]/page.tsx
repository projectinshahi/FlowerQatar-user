import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { getCouponById } from "@/lib/actions/marketing.actions";
import { getTargetOptions } from "@/lib/marketing-options";
import { StateBadge, discountText, formatMoney, formatDate } from "@/components/admin/marketing/ui";

export const metadata = { title: "Coupon Details | Marketing" };

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

export default async function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [res, { productOptions, categoryOptions }] = await Promise.all([getCouponById(id), getTargetOptions()]);
  if (!res.success || !res.data) notFound();
  const c = res.data;

  const prodMap = new Map(productOptions.map((p) => [p.value, p.label]));
  const catMap = new Map(categoryOptions.map((p) => [p.value, p.label]));
  const names = (ids: string[], map: Map<string, string>) => (ids?.length ? ids.map((i) => map.get(i) || i).join(", ") : "—");

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing/coupons" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-bold text-gray-900 font-mono">{c.code}</h1>
              <StateBadge state={c.state} />
            </div>
            <p className="text-gray-500 text-sm">{c.name}</p>
          </div>
        </div>
        <Link href={`/admin/marketing/coupons/${c.id}/edit`} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black"><Edit size={16} /> Edit</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Discount" value={discountText(c.type, c.discountValue, c.maxDiscount)} />
        <Stat label="Min Order" value={formatMoney(c.minOrderAmount)} />
        <Stat label="Used" value={c.usageLimit != null ? `${c.currentUsage} / ${c.usageLimit}` : c.currentUsage} />
        <Stat label="Remaining" value={c.remaining != null ? c.remaining : "∞"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-medium text-gray-900">Configuration</h3>
          <dl className="text-sm divide-y divide-gray-50">
            <div className="flex justify-between py-2"><dt className="text-gray-500">Auto Apply</dt><dd className="text-gray-900">{c.autoApply ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-gray-500">Free Delivery</dt><dd className="text-gray-900">{c.freeDelivery ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-gray-500">Per Customer Limit</dt><dd className="text-gray-900">{c.usagePerCustomer ?? "Unlimited"}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-gray-500">Priority</dt><dd className="text-gray-900">{c.priority}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-gray-500">Starts</dt><dd className="text-gray-900">{formatDate(c.startDate)}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-gray-500">Ends</dt><dd className="text-gray-900">{formatDate(c.endDate)}</dd></div>
          </dl>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-medium text-gray-900">Targeting</h3>
          <dl className="text-sm space-y-3">
            <div><dt className="text-gray-500 mb-0.5">Applicable Categories</dt><dd className="text-gray-900">{names(c.applicableCategories, catMap)}</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Applicable Products</dt><dd className="text-gray-900">{names(c.applicableProducts, prodMap)}</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Excluded Categories</dt><dd className="text-gray-900">{names(c.excludedCategories, catMap)}</dd></div>
            <div><dt className="text-gray-500 mb-0.5">Excluded Products</dt><dd className="text-gray-900">{names(c.excludedProducts, prodMap)}</dd></div>
          </dl>
        </div>
      </div>

      {/* Usage history */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Usage History</h3>
          <p className="text-xs text-gray-500">{c.usages.length} record{c.usages.length === 1 ? "" : "s"}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3 text-right">Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {c.usages.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No usage yet.</td></tr>
              ) : c.usages.map((u: any) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 text-gray-600">{formatDate(u.usedAt)}</td>
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">{u.userId ? u.userId.slice(0, 8) : "Guest"}</td>
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">{u.orderId ? u.orderId.slice(0, 8) : "—"}</td>
                  <td className="px-5 py-3 text-right text-gray-900">{formatMoney(u.discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
