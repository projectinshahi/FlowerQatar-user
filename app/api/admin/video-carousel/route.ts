import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { err, ok, withHandler } from "@/lib/api/handler";

export const GET = withHandler(async ({ req }) => {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "0");
  const limit = parseInt(searchParams.get("limit") || "0");

  const queryOptions: any = {
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  };

  if (page > 0 && limit > 0) {
    queryOptions.skip = (page - 1) * limit;
    queryOptions.take = limit;
  }

  const videos = await prisma.videoCarousel.findMany(queryOptions);
  return ok({ data: videos });
}, { access: "admin" });

export const POST = withHandler(async ({ req }) => {
  const body = await req.json();
  const { title, description, videoUrl, thumbnailUrl, displayOrder, isActive } = body;

  // Basic validation
  if (!title || !videoUrl) {
    return err("Title and Video URL are required", 400);
  }
  if (title.length < 2 || title.length > 100) {
    return err("Title must be 2-100 characters", 400);
  }
  if (description && description.length > 300) {
    return err("Description cannot exceed 300 characters", 400);
  }

  const newVideo = await prisma.videoCarousel.create({
    data: {
      title,
      description: description || null,
      videoUrl,
      thumbnailUrl: thumbnailUrl || null,
      displayOrder: typeof displayOrder === "number" ? displayOrder : (parseInt(displayOrder) || 0),
      isActive: isActive !== undefined ? isActive : true,
    },
  });
  return ok({ data: newVideo }, 201);
}, { access: "admin" });
