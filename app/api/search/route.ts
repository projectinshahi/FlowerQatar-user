import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapDbProductToStore } from "@/lib/store-products";

/**
 * GET /api/search?q=...  — searches published products by name, description and
 * category, returning storefront-shaped results.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  // Each term drives five ILIKE %q% scans; nothing useful is longer than this.
  if (q.length < 1 || q.length > 100) return NextResponse.json({ success: true, data: [] });

  try {
    const rows = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { subcategory: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { subcategory: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    return NextResponse.json({ success: true, data: rows.map(mapDbProductToStore) });
  } catch (e) {
    console.error("[api/search]", e);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
