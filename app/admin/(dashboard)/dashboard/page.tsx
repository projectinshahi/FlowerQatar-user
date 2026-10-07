import type { LucideIcon } from "lucide-react";
import { Ticket, Play, CalendarClock, TicketX, Truck, Activity, BadgePercent, Award } from "lucide-react";
import { getMarketingStats } from "@/lib/actions/marketing.actions";
import { formatMoney } from "@/components/admin/marketing/ui";
import UsageChart from "@/components/admin/marketing/UsageChart";

export const metadata = { title: "Marketing Dashboard" };
export const dynamic = "force-dynamic";

function Card({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
      </div>
      <div className={`shrink-0 p-2 rounded-lg ${accent ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

export default async function MarketingDashboardPage() {
  const res = await getMarketingStats();

  if (!res.success) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
        {res.error}
      </div>
    );
  }

  const { cards, topCoupons, usageTimeline } = res.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Marketing Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of coupons, promotions and campaign performance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Active Coupons" value={cards.activeCoupons} icon={Ticket} accent />
        <Card label="Running Promotions" value={cards.runningPromotions} icon={Play} />
        <Card label="Scheduled Promotions" value={cards.scheduledPromotions} icon={CalendarClock} />
        <Card label="Expired Coupons" value={cards.expiredCoupons} icon={TicketX} />
        <Card label="Free Delivery Campaigns" value={cards.freeDeliveryCampaigns} icon={Truck} />
        <Card label="Coupon Usage" value={cards.couponUsageCount} icon={Activity} />
        <Card label="Total Discount Given" value={formatMoney(cards.totalDiscountGiven)} icon={BadgePercent} accent />
        <Card label="Most Used Coupon" value={cards.mostUsedCoupon?.code ?? "—"} icon={Award} />
      </div>

      <UsageChart timeline={usageTimeline} topCoupons={topCoupons} />
    </div>
  );
}
