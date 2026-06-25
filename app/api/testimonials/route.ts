import { NextResponse } from "next/server";
// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        location: true,
        review: true,
        rating: true,
        imageUrl: true,
        displayOrder: true,
        createdAt: true,
      },
    });

    // Log the number of fetched testimonials (including inactive)
    console.log(`[PUBLIC TESTIMONIALS API] Fetched ${testimonials.length} rows`);
    return NextResponse.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    console.error('[PUBLIC TESTIMONIALS API] Error fetching testimonials:', error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
