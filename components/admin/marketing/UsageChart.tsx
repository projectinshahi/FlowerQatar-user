"use client";

import { formatMoney } from "./ui";

type TimelinePoint = { date: string; uses: number; discount: number };
type TopCoupon = { code: string; name: string; uses: number; discount: number };

function fmtDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  // Fixed locale + UTC so SSR and client hydration match.
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-center text-sm text-gray-400">
      {label}
    </div>
  );
}

export default function UsageChart({
  timeline,
  topCoupons,
}: {
  timeline: TimelinePoint[];
  topCoupons: TopCoupon[];
}) {
  const maxUses = Math.max(1, ...timeline.map((t) => t.uses));
  const maxTopUses = Math.max(1, ...topCoupons.map((c) => c.uses));
  const hasUsage = timeline.some((t) => t.uses > 0);
  const labelEvery = timeline.length > 7 ? Math.ceil(timeline.length / 7) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Coupon usage over time */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Coupon Usage</h2>
          <span className="text-xs text-gray-400">last 14 days</span>
        </div>

        {hasUsage ? (
          <div>
            <div className="flex items-end gap-1 h-40">
              {timeline.map((t) => {
                const h = t.uses > 0 ? Math.max(4, (t.uses / maxUses) * 100) : 0;
                return (
                  <div
                    key={t.date}
                    className="group flex-1 flex flex-col justify-end h-full"
                    title={`${fmtDay(t.date)} · ${t.uses} use${t.uses === 1 ? "" : "s"} · ${formatMoney(t.discount)}`}
                  >
                    <div className="w-full min-h-[2px] rounded-t bg-gray-100" style={{ height: "100%" }}>
                      <div
                        className="w-full rounded-t bg-indigo-500 transition-colors group-hover:bg-indigo-600"
                        style={{ height: `${h}%`, marginTop: `${100 - h}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 mt-2">
              {timeline.map((t, i) => (
                <div key={t.date} className="flex-1 text-center text-[10px] leading-tight text-gray-400 truncate">
                  {i % labelEvery === 0 ? fmtDay(t.date) : ""}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState label="No coupon usage in this period." />
        )}
      </div>

      {/* Top coupons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Coupons</h2>

        {topCoupons.length > 0 ? (
          <div className="space-y-3">
            {topCoupons.map((c) => {
              const w = Math.max(4, (c.uses / maxTopUses) * 100);
              return (
                <div
                  key={c.code}
                  title={`${c.name || c.code} · ${c.uses} use${c.uses === 1 ? "" : "s"} · ${formatMoney(c.discount)}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1 gap-2">
                    <span className="font-mono font-medium text-gray-900 truncate">{c.code}</span>
                    <span className="shrink-0 text-gray-500">
                      {c.uses} · {formatMoney(c.discount)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState label="No coupon usage yet." />
        )}
      </div>
    </div>
  );
}
