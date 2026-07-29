import type { LucideIcon } from "lucide-react";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, XCircle, Download } from "lucide-react";
import { getReportStats } from "@/lib/actions/reports.actions";
import { formatMoney } from "@/components/admin/marketing/ui";
import RangeSelect from "./RangeSelect";

export const metadata = { title: "Reports & Analytics" };
export const dynamic = "force-dynamic";

function Kpi({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
      </div>
      <div className="shrink-0 p-2 rounded-lg bg-indigo-50 text-indigo-600">
        <Icon size={18} />
      </div>
    </div>
  );
}

function ProductBars({ title, rows }: { title: string; rows: { productId: string; name: string; quantity: number; revenue: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.quantity));
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.productId} title={`${r.name} · ${r.quantity} sold · ${formatMoney(r.revenue)}`}>
              <div className="flex items-center justify-between text-xs mb-1 gap-2">
                <span className="font-medium text-gray-900 truncate">{r.name}</span>
                <span className="shrink-0 text-gray-500">{r.quantity} · {formatMoney(r.revenue)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(4, (r.quantity / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-sm text-gray-400">No product sales in this period.</div>
      )}
    </div>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const res = await getReportStats(range);

  if (!res.success) {
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{res.error}</div>;
  }

  const { kpis, periods, trend, topProducts, lowProducts, delivery, customers, range: r } = res.data;
  const maxRev = Math.max(1, ...trend.map((t) => t.revenue));
  const labelEvery = trend.length > 12 ? Math.ceil(trend.length / 12) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-2">
          <RangeSelect />
          <a
            href={`/api/admin/reports/export?range=${r.preset}`}
            className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={15} /> Export CSV
          </a>
        </div>
      </div>
      <p className="text-sm text-gray-500 -mt-3">Showing: {r.label}</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Revenue" value={formatMoney(kpis.revenue)} icon={DollarSign} />
        <Kpi label="Orders" value={kpis.orders} icon={ShoppingCart} />
        <Kpi label="Customers" value={kpis.customers} icon={Users} />
        <Kpi label="Products Sold" value={kpis.productsSold} icon={Package} />
        <Kpi label="Avg Order Value" value={formatMoney(kpis.avgOrderValue)} icon={TrendingUp} />
        <Kpi label="Cancelled" value={kpis.cancelled} icon={XCircle} />
      </div>

      {/* Period figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Today" value={formatMoney(periods.today)} icon={DollarSign} />
        <Kpi label="Last 7 Days" value={formatMoney(periods.week)} icon={DollarSign} />
        <Kpi label="This Month" value={formatMoney(periods.month)} icon={DollarSign} />
        <Kpi label="This Year" value={formatMoney(periods.year)} icon={DollarSign} />
      </div>

      {/* Sales trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Sales Trend</h2>
          <span className="text-xs text-gray-400">{r.label}</span>
        </div>
        {trend.some((t) => t.revenue > 0) ? (
          <div>
            <div className="flex items-end gap-1 h-48">
              {trend.map((t, i) => {
                const h = t.revenue > 0 ? Math.max(4, (t.revenue / maxRev) * 100) : 0;
                return (
                  <div key={i} className="group flex-1 flex flex-col justify-end h-full" title={`${t.label} · ${formatMoney(t.revenue)} · ${t.orders} order${t.orders === 1 ? "" : "s"}`}>
                    <div className="w-full rounded-t bg-gray-100" style={{ height: "100%" }}>
                      <div className="w-full rounded-t bg-indigo-500 transition-colors group-hover:bg-indigo-600" style={{ height: `${h}%`, marginTop: `${100 - h}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 mt-2">
              {trend.map((t, i) => (
                <div key={i} className="flex-1 text-center text-[10px] leading-tight text-gray-400 truncate">
                  {i % labelEvery === 0 ? t.label : ""}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">No sales in this period.</div>
        )}
      </div>

      {/* Product performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProductBars title="Top Selling Products" rows={topProducts} />
        <ProductBars title="Lowest Selling Products" rows={lowProducts} />
      </div>

      {/* Delivery + customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Delivery Status</h2>
          <div className="space-y-2">
            {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{s.toLowerCase()}</span>
                <span className="font-semibold text-gray-900">{delivery[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Customers</h2>
          <div className="space-y-2 text-sm">
            <Line label="Total (in period)" value={customers.total} />
            <Line label="New customers" value={customers.new} />
            <Line label="Returning" value={customers.returning} />
            <Line label="Repeat rate" value={`${customers.repeatRate.toFixed(1)}%`} />
            <Line label="Avg orders / customer" value={customers.avgOrders.toFixed(2)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
