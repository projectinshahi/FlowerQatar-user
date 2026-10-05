import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreProducts, mapDbProductToStore } from "@/lib/store-products";

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
    const query = {
      where: {
        status: "PUBLISHED" as const,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { shortDescription: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
          { subcategory: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      },
      orderBy: { createdAt: "desc" as const },
      take: 12,
    };
    // The database only picks the matching ids; the products themselves come from the cached
    // catalogue (same mapper), so each keystroke is one small query instead of full rows.
    const [hits, catalogue] = await Promise.all([
      prisma.product.findMany({ ...query, select: { id: true } }),
      getStoreProducts(),
    ]);
    // getStoreProducts returns [] when its read fails; fall back to reading the rows.
    if (!catalogue.length && hits.length) {
      const rows = await prisma.product.findMany({ ...query, include: { subcategory: true } });
      return NextResponse.json({ success: true, data: rows.map(mapDbProductToStore) });
    }
    const byId = new Map(catalogue.map((p) => [p.id, p]));
    return NextResponse.json({ success: true, data: hits.flatMap((h) => byId.get(h.id) ?? []) });
  } catch (e) {
    console.error("[api/search]", e);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
