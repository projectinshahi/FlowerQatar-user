import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { err, ok, withHandler } from "@/lib/api/handler";
import { deleteFromCloudinary, uploadBase64ToCloudinary } from "@/lib/cloudinary.service";

function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const parts = url.split("/image/upload/");
  if (parts.length < 2) return null;
  const subparts = parts[1].split("/");
  if (subparts.length < 2) return null;
  if (subparts[0].startsWith("v")) {
    subparts.shift();
  }
  const remaining = subparts.join("/");
  const dotIndex = remaining.lastIndexOf(".");
  if (dotIndex !== -1) {
    return remaining.substring(0, dotIndex);
  }
  return remaining;
}

export const PUT = withHandler(
  async ({ req, params }): Promise<NextResponse> => {
    const routeParams = await params;
    const { id } = routeParams;

    const existing = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      return err("Testimonial not found", 404);
    }

    const body = await req.json();
    const { name, location, rating, review, isActive, displayOrder, imageUrl } = body;

    let finalImageUrl = existing.imageUrl;

    // Check if image is changing or being removed
    if (imageUrl !== undefined) {
      if (imageUrl === null || imageUrl === "") {
        // Remove image
        if (existing.imageUrl) {
          const oldPublicId = getPublicIdFromUrl(existing.imageUrl);
          if (oldPublicId) {
            try {
              await deleteFromCloudinary(oldPublicId);
            } catch (e) {
              console.warn("Failed to delete old image from Cloudinary:", e);
            }
          }
        }
        finalImageUrl = null;
      } else if (imageUrl.startsWith("data:")) {
        // Upload new image
        try {
          const uploaded = await uploadBase64ToCloudinary(imageUrl, "testimonials");
          
          // Delete old image
          if (existing.imageUrl) {
            const oldPublicId = getPublicIdFromUrl(existing.imageUrl);
            if (oldPublicId) {
              try {
                await deleteFromCloudinary(oldPublicId);
              } catch (e) {
                console.warn("Failed to delete old image from Cloudinary:", e);
              }
            }
          }
          finalImageUrl = uploaded.url;
        } catch (uploadError) {
          console.error("Cloudinary upload failed:", uploadError);
          return err("Failed to upload image to Cloudinary", 500);
        }
      } else {
        // Keep or use new non-base64 URL (if different, delete old one)
        if (imageUrl !== existing.imageUrl && existing.imageUrl) {
          const oldPublicId = getPublicIdFromUrl(existing.imageUrl);
          if (oldPublicId) {
            try {
              await deleteFromCloudinary(oldPublicId);
            } catch (e) {
              console.warn("Failed to delete old image from Cloudinary:", e);
            }
          }
        }
        finalImageUrl = imageUrl;
      }
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location: location || null }),
        ...(rating !== undefined && { rating: typeof rating === "number" ? rating : (parseInt(rating) || 5) }),
        ...(review !== undefined && { review }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder: typeof displayOrder === "number" ? displayOrder : (parseInt(displayOrder) || 0) }),
        imageUrl: finalImageUrl,
      },
    });

    return ok({ data: updated });
  },
  { access: "admin" }
);

export const DELETE = withHandler(
  async ({ params }): Promise<NextResponse> => {
    const routeParams = await params;
    const { id } = routeParams;

    const existing = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      return err("Testimonial not found", 404);
    }

    // Delete image from Cloudinary if it exists
    if (existing.imageUrl) {
      const publicId = getPublicIdFromUrl(existing.imageUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (e) {
          console.warn("Failed to delete image from Cloudinary on testimonial deletion:", e);
        }
      }
    }

    await prisma.testimonial.delete({
      where: { id },
    });

    return ok({ message: "Testimonial deleted successfully" });
  },
  { access: "admin" }
);
