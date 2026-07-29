import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/admin-guard";
import { resolveRange } from "@/lib/reports/range";

// Escape a CSV field: wrap in quotes and double any embedded quotes.
const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/**
 * GET /api/admin/reports/export?range=30d — orders in the range as a CSV download.
 * Respects the same range presets as the report page. Admin-only. No library needed
 * (CSV opens directly in Excel).
 */
export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const preset = new URL(request.url).searchParams.get("range");
  const range = resolveRange(preset);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: range.start, lt: range.end } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      paymentMethod: true,
      subtotal: true,
      shippingFee: true,
      tax: true,
      discount: true,
      pointsRedeemed: true,
      totalAmount: true,
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      _count: { select: { items: true } },
    },
  });

  const header = [
    "Order Number", "Date", "Customer", "Email", "Phone", "Status", "Payment Method",
    "Items", "Subtotal", "Shipping", "Tax", "Discount", "Points Redeemed", "Grand Total",
  ];
  const rows = orders.map((o) => [
    o.id.slice(0, 8).toUpperCase(),
    o.createdAt.toISOString().slice(0, 10),
    `${o.user?.firstName ?? ""} ${o.user?.lastName ?? ""}`.trim() || "—",
    o.user?.email ?? "—",
    o.user?.phone ?? "—",
    o.status,
    o.paymentMethod,
    o._count.items,
    o.subtotal, o.shippingFee, o.tax, o.discount, o.pointsRedeemed, o.totalAmount,
  ]);

  // Report header block (company / title / generated / filter) above the table.
  const meta = [
    ["Lebami"],
    ["Order Report"],
    [`Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC`],
    [`Filter: ${range.label}`],
    [`Total Orders: ${orders.length}`],
    [],
  ];
  const csv = [...meta, header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="order-report-${range.preset}.csv"`,
    },
  });
}
