import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

// GET /api/addons — active gift add-ons (public catalog).
export async function GET() {
  try {
    const rows = await prisma.addOn.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, description: true, price: true, image: true },
    });
    const data = rows.map((r) => ({ ...r, price: Number(r.price) }));
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("[addons]", e);
    return NextResponse.json({ success: false, error: "Could not load add-ons" }, { status: 500 });
  }
}
