import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

// GET /api/greeting-cards — active greeting-card templates (public catalog).
export async function GET() {
  try {
    const data = await prisma.greetingCardTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, image: true },
    });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("[greeting-cards]", e);
    return NextResponse.json({ success: false, error: "Could not load greeting cards" }, { status: 500 });
  }
}
