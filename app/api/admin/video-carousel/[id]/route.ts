import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { err, ok, withHandler } from "@/lib/api/handler";

export const PUT = withHandler(
  async ({ req, params }) => {
    const id = params?.id;
    if (!id) return err("ID is required", 400);

    const body = await req.json();
    
    // Only update fields that are provided
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.displayOrder !== undefined) updateData.displayOrder = typeof body.displayOrder === "number" ? body.displayOrder : parseInt(body.displayOrder);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await prisma.videoCarousel.update({
      where: { id },
      data: updateData,
    });

    return ok({ data: updated });
  },
  { access: "admin" }
);

export const DELETE = withHandler(
  async ({ req, params }) => {
    const id = params?.id;
    if (!id) return err("ID is required", 400);

    await prisma.videoCarousel.delete({
      where: { id },
    });

    return ok({ message: "Deleted successfully" });
  },
  { access: "admin" }
);
