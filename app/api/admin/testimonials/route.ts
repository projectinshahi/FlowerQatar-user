import { NextResponse } from "next/server";
// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { prisma } from "@/lib/prisma";
import { err, ok, withHandler } from "@/lib/api/handler";
import { uploadBase64ToCloudinary } from "@/lib/cloudinary.service";

export const GET = withHandler(
  async ({ req }): Promise<NextResponse> => {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "0");

    let queryOptions: any = {
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    };

    if (page > 0 && limit > 0) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const testimonials = await prisma.testimonial.findMany(queryOptions);
    const activeCount = testimonials.filter(t => t.isActive).length;
    console.log(`[ADMIN TESTIMONIALS API] Fetched ${testimonials.length} rows, active ${activeCount}`);

    return ok({ data: testimonials });
  },
  { access: "admin" }
);

export const POST = withHandler(
  async ({ req }): Promise<NextResponse> => {
    const body = await req.json();
    const { name, location, rating, review, isActive, displayOrder, imageUrl } = body;

      // Validation checks
      if (!name || !review) {
        return err("Name and Review are required", 400);
      }
      if (name.length < 2 || name.length > 50) {
        return err("Name must be between 2 and 50 characters", 400);
      }
      if (location && location.length > 50) {
        return err("Location must be at most 50 characters", 400);
      }
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return err("Rating must be between 1 and 5", 400);
      }
      if (review.length < 80 || review.length > 300) {
        return err("Review must be between 80 and 300 characters", 400);
      }

    let finalImageUrl: string | null = null;
    if (imageUrl) {
      if (imageUrl.startsWith("data:")) {
        try {
          const uploaded = await uploadBase64ToCloudinary(imageUrl, "testimonials");
          finalImageUrl = uploaded.url;
        } catch (uploadError) {
          console.error('[ADMIN TESTIMONIALS API] Error fetching testimonials:', uploadError);
          return err("Failed to upload image to Cloudinary", 500);
        }
      } else {
        finalImageUrl = imageUrl;
      }
    }

    const newTestimonial = await prisma.testimonial.create({
        data: {
          name,
          location: location || null,
          rating,
          review,
          isActive: isActive !== undefined ? isActive : true,
          displayOrder: typeof displayOrder === "number" ? displayOrder : (parseInt(displayOrder) || 0),
          imageUrl: finalImageUrl,
        },
    });

    return ok({ data: newTestimonial }, 201);
  },
  { access: "admin" }
);
