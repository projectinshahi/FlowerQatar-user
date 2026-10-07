"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/admin-guard";
import { resolveRange } from "@/lib/reports/range";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const n = (v: unknown) => Number(v ?? 0) || 0;
const dayKey = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
const monthKey = (d: Date) => d.toISOString().slice(0, 7); // YYYY-MM (UTC)

export interface TrendPoint { label: string; revenue: number; orders: number }
export interface ProductRow { productId: string; name: string; quantity: number; revenue: number }

export interface ReportStats {
  range: { preset: string; label: string; start: string; end: string };
  kpis: {
    revenue: number;
    orders: number;
    customers: number;
    productsSold: number;
    avgOrderValue: number;
    cancelled: number;
  };
  periods: { today: number; week: number; month: number; year: number };
  trend: TrendPoint[];
  topProducts: ProductRow[];
  lowProducts: ProductRow[];
  delivery: Record<string, number>; // status -> count
  customers: { total: number; new: number; returning: number; repeatRate: number; avgOrders: number };
}

/**
 * Aggregate all M16 report figures for a date-range preset. Revenue/product/customer metrics
 * exclude CANCELLED orders (that value was refunded). Admin-only.
 */
export async function getReportStats(preset?: string): Promise<ActionResult<ReportStats>> {
  try {
    await requireAdmin();
    const range = resolveRange(preset);
    const inRange = { gte: range.start, lt: range.end };
    const notCancelled = { not: "CANCELLED" as const };

    // Fixed period figures (independent of the selected range).
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const weekAgo = new Date(startOfDay.getTime() - 6 * 86_400_000);
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const sumSince = async (since: Date) =>
      n((await prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: notCancelled, createdAt: { gte: since } } }))._sum.totalAmount);

    // Every read below is independent, so they go out together; only the repeat-rate groupBy
    // further down has to wait for the orders.
    const [orders, items, today, week, month, year, newCustomers] = await Promise.all([
      // Orders in range (minimal columns) — drives KPIs, trend, delivery, repeat rate.
      prisma.order.findMany({
        where: { createdAt: inRange },
        select: { totalAmount: true, status: true, createdAt: true, userId: true },
      }),
      // Line items in range (non-cancelled) — product performance + units sold.
      prisma.orderItem.findMany({
        where: { order: { createdAt: inRange, status: notCancelled } },
        select: { productId: true, quantity: true, price: true, product: { select: { name: true } } },
      }),
      sumSince(startOfDay),
      sumSince(weekAgo),
      sumSince(startOfMonth),
      sumSince(startOfYear),
      prisma.user.count({ where: { createdAt: inRange } }),
    ]);

    // KPIs.
    const live = orders.filter((o) => o.status !== "CANCELLED");
    const revenue = live.reduce((s, o) => s + n(o.totalAmount), 0);
    const productsSold = items.reduce((s, it) => s + it.quantity, 0);
    const custIds = new Set(live.map((o) => o.userId));
    const kpis = {
      revenue,
      orders: live.length,
      customers: custIds.size,
      productsSold,
      avgOrderValue: live.length ? revenue / live.length : 0,
      cancelled: orders.length - live.length,
    };

    // Delivery/status breakdown.
    const delivery: Record<string, number> = {};
    for (const o of orders) delivery[o.status] = (delivery[o.status] ?? 0) + 1;

    // Trend: daily for short spans, monthly for long ones.
    const spanDays = (range.end.getTime() - range.start.getTime()) / 86_400_000;
    const byMonth = spanDays > 62;
    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (const o of live) {
      const key = byMonth ? monthKey(o.createdAt) : dayKey(o.createdAt);
      const b = buckets.get(key) ?? { revenue: 0, orders: 0 };
      b.revenue += n(o.totalAmount);
      b.orders += 1;
      buckets.set(key, b);
    }
    const trend: TrendPoint[] = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, b]) => ({
        label: byMonth
          ? new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
          : new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        revenue: b.revenue,
        orders: b.orders,
      }));

    // Product performance.
    const prodMap = new Map<string, ProductRow>();
    for (const it of items) {
      const row = prodMap.get(it.productId) ?? { productId: it.productId, name: it.product?.name ?? "Unknown", quantity: 0, revenue: 0 };
      row.quantity += it.quantity;
      row.revenue += it.quantity * n(it.price);
      prodMap.set(it.productId, row);
    }
    const ranked = [...prodMap.values()].sort((a, b) => b.quantity - a.quantity);
    const topProducts = ranked.slice(0, 5);
    const lowProducts = ranked.length > 5 ? ranked.slice(-5).reverse() : [];

    // Customer repeat rate: returning = in-range customers with >1 order all-time.
    const idList = [...custIds];
    const allTime = idList.length
      ? await prisma.order.groupBy({ by: ["userId"], where: { userId: { in: idList }, status: notCancelled }, _count: { _all: true } })
      : [];
    const returning = allTime.filter((g) => g._count._all > 1).length;
    const customers = {
      total: custIds.size,
      new: newCustomers,
      returning,
      repeatRate: custIds.size ? (returning / custIds.size) * 100 : 0,
      avgOrders: custIds.size ? live.length / custIds.size : 0,
    };

    return {
      success: true,
      data: {
        range: { preset: range.preset, label: range.label, start: range.start.toISOString(), end: range.end.toISOString() },
        kpis,
        periods: { today, week, month, year },
        trend,
        topProducts,
        lowProducts,
        delivery,
        customers,
      },
    };
  } catch (e) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    console.error("[reports.action]", e);
    return { success: false, error: (e instanceof Error && e.message) || "Could not build the report" };
  }
}
