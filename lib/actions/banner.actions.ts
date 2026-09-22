"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/admin-guard";
import { bannerSchema, type BannerFormValues } from "@/lib/validations/banner";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { publishChange } from "@/lib/live-sync";
import type { LiveAction } from "@/lib/live-events";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const serialize = <T>(v: T): T => JSON.parse(JSON.stringify(v));

async function withAdmin<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
    return { success: true, data: await fn() };
  } catch (e: any) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    console.error("[banner.action]", e);
    return { success: false, error: e.message || "Something went wrong" };
  }
}

/** The banner renders only on the storefront home page (see lib/live-sync.ts). */
function revalidate(action: LiveAction, id: string) {
  revalidatePath("/admin/banners");
  publishChange({ type: `banner.${action}`, ids: [id] });
}

export async function getBanners() {
  return withAdmin(async () => {
    const banners = await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return serialize(banners);
  });
}

/** Public — active banners for the storefront (no auth required). */
export async function getActiveBanners() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        subheading: true,
        description: true,
        titleColor: true,
        subheadingColor: true,
        descriptionColor: true,
        videoUrl: true,
      },
      take: 1, // single-banner policy
    });
    return serialize(banners);
  } catch (e) {
    console.error("[getActiveBanners]", e);
    return [];
  }
}

export async function createBanner(data: BannerFormValues) {
  return withAdmin(async () => {
    // Only a single banner is allowed. Refuse to create a second one.
    const existing = await prisma.banner.count();
    if (existing >= 1) {
      throw new Error("Only one banner is allowed. Edit or delete the existing banner first.");
    }
    const parsed = bannerSchema.parse(data);
    const { id: _omit, ...rest } = parsed;
    const banner = await prisma.banner.create({ data: rest });
    revalidate("created", banner.id);
    return serialize(banner);
  });
}

export async function updateBanner(id: string, data: BannerFormValues) {
  return withAdmin(async () => {
    const parsed = bannerSchema.parse(data);
    const { id: _omit, ...rest } = parsed;
    const banner = await prisma.banner.update({ where: { id }, data: rest });
    revalidate("updated", id);
    return serialize(banner);
  });
}

export async function toggleBannerActive(id: string, isActive: boolean) {
  return withAdmin(async () => {
    await prisma.banner.update({ where: { id }, data: { isActive } });
    revalidate("statusChanged", id);
    return { id, isActive };
  });
}

export async function deleteBanner(id: string) {
  return withAdmin(async () => {
    const banner = await prisma.banner.findUnique({ where: { id }, select: { videoPublicId: true } });
    if (banner?.videoPublicId) {
      // Best-effort Cloudinary cleanup (video resource).
      await deleteCloudinaryImage(banner.videoPublicId, "video").catch((e) =>
        console.error("Failed to delete Cloudinary video:", e)
      );
    }
    await prisma.banner.delete({ where: { id } });
    revalidate("deleted", id);
    return { id };
  });
}
