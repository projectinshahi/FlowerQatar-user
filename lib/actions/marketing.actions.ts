"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/admin-guard";
import {
  couponSchema,
  promotionSchema,
  freeDeliverySchema,
  type CouponFormValues,
  type PromotionFormValues,
  type FreeDeliveryFormValues,
} from "@/lib/validations/marketing";
import { getOfferState } from "@/lib/services/marketing";

/* ───────────────────────── Helpers ─────────────────────────── */

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const serialize = <T>(v: T): T => JSON.parse(JSON.stringify(v));

async function withAdmin<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
    const data = await fn();
    return { success: true, data };
  } catch (e: any) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { success: false, error: "A record with this unique value already exists" };
    }
    console.error("[marketing.action]", e);
    return { success: false, error: e.message || "Something went wrong" };
  }
}

function paginate(page = 1, limit = 10) {
  const p = Math.max(1, page);
  const l = Math.min(100, Math.max(1, limit));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

/** Random uppercase code without ambiguous characters (no 0/O/1/I). */
function randomCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Generates a coupon code guaranteed not to collide with an existing one. */
async function generateUniqueCouponCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = randomCode(8);
    const exists = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
    if (!exists) return code;
  }
  return `${randomCode(6)}${Date.now().toString(36).toUpperCase()}`;
}

/* ═══════════════════════════ COUPONS ════════════════════════ */

export interface CouponListParams {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  state?: "RUNNING" | "SCHEDULED" | "EXPIRED";
  type?: "FLAT" | "PERCENTAGE";
  usage?: "used" | "unused";
  autoApply?: boolean;
  sortBy?: "newest" | "oldest" | "priority" | "usage" | "endingSoon";
  page?: number;
  limit?: number;
}

export async function getCoupons(params: CouponListParams = {}) {
  return withAdmin(async () => {
    const { skip, take, page, limit } = paginate(params.page, params.limit);
    const now = new Date();
    const where: Prisma.CouponWhereInput = {};
    const and: Prisma.CouponWhereInput[] = [];

    if (params.search) {
      and.push({
        OR: [
          { code: { contains: params.search, mode: "insensitive" } },
          { name: { contains: params.search, mode: "insensitive" } },
        ],
      });
    }
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (typeof params.autoApply === "boolean") where.autoApply = params.autoApply;
    if (params.usage === "used") where.currentUsage = { gt: 0 };
    if (params.usage === "unused") where.currentUsage = 0;

    if (params.state === "RUNNING") and.push({ status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } });
    if (params.state === "SCHEDULED") and.push({ startDate: { gt: now } });
    if (params.state === "EXPIRED") and.push({ endDate: { lt: now } });
    if (and.length) where.AND = and;

    const orderBy: Prisma.CouponOrderByWithRelationInput =
      params.sortBy === "oldest" ? { createdAt: "asc" } :
      params.sortBy === "priority" ? { priority: "desc" } :
      params.sortBy === "usage" ? { currentUsage: "desc" } :
      params.sortBy === "endingSoon" ? { endDate: "asc" } :
      { createdAt: "desc" };

    const [rows, total] = await Promise.all([
      prisma.coupon.findMany({ where, orderBy, skip, take }),
      prisma.coupon.count({ where }),
    ]);

    const coupons = rows.map((c) => ({
      ...serialize(c),
      state: getOfferState(c.status, c.startDate, c.endDate, now),
    }));

    return { coupons, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  });
}

export async function getCouponById(id: string) {
  return withAdmin(async () => {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { usages: { orderBy: { usedAt: "desc" }, take: 100 } },
    });
    if (!coupon) throw new Error("Coupon not found");

    const remaining = coupon.usageLimit != null ? Math.max(0, coupon.usageLimit - coupon.currentUsage) : null;
    return {
      ...serialize(coupon),
      remaining,
      state: getOfferState(coupon.status, coupon.startDate, coupon.endDate),
    };
  });
}

export async function createCoupon(data: CouponFormValues) {
  return withAdmin(async () => {
    const parsed = couponSchema.parse(data);
    const admin = await requireAdmin();
    const { id: _omit, ...rest } = parsed;
    const code = rest.code || (await generateUniqueCouponCode());
    const coupon = await prisma.coupon.create({ data: { ...rest, code, createdBy: admin.id } });
    revalidatePath("/admin/marketing/coupons");
    return serialize(coupon);
  });
}

export async function updateCoupon(id: string, data: CouponFormValues) {
  return withAdmin(async () => {
    const parsed = couponSchema.parse(data);
    const { id: _omit, ...rest } = parsed;
    const coupon = await prisma.coupon.update({ where: { id }, data: rest });
    revalidatePath("/admin/marketing/coupons");
    revalidatePath(`/admin/marketing/coupons/${id}`);
    return serialize(coupon);
  });
}

export async function duplicateCoupon(id: string) {
  return withAdmin(async () => {
    const src = await prisma.coupon.findUnique({ where: { id } });
    if (!src) throw new Error("Coupon not found");
    const admin = await requireAdmin();
    const { id: _i, createdAt: _c, updatedAt: _u, currentUsage: _cu, code, ...rest } = src;
    const coupon = await prisma.coupon.create({
      data: {
        ...rest,
        code: `${code}-COPY-${Date.now().toString(36).toUpperCase()}`,
        name: `${src.name} (Copy)`,
        currentUsage: 0,
        status: "INACTIVE",
        createdBy: admin.id,
      },
    });
    revalidatePath("/admin/marketing/coupons");
    return serialize(coupon);
  });
}

export async function deleteCoupon(id: string) {
  return withAdmin(async () => {
    await prisma.coupon.delete({ where: { id } });
    revalidatePath("/admin/marketing/coupons");
    return { id };
  });
}

export async function bulkDeleteCoupons(ids: string[]) {
  return withAdmin(async () => {
    await prisma.coupon.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/marketing/coupons");
    return { count: ids.length };
  });
}

export async function bulkSetCouponStatus(ids: string[], status: "ACTIVE" | "INACTIVE") {
  return withAdmin(async () => {
    await prisma.coupon.updateMany({ where: { id: { in: ids } }, data: { status } });
    revalidatePath("/admin/marketing/coupons");
    return { count: ids.length };
  });
}

/* ═══════════════════════════ PROMOTIONS ═════════════════════ */

export interface PromotionListParams {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  state?: "RUNNING" | "SCHEDULED" | "EXPIRED";
  promotionType?: string;
  page?: number;
  limit?: number;
}

export async function getPromotions(params: PromotionListParams = {}) {
  return withAdmin(async () => {
    const { skip, take, page, limit } = paginate(params.page, params.limit);
    const now = new Date();
    const where: Prisma.PromotionWhereInput = {};
    const and: Prisma.PromotionWhereInput[] = [];

    if (params.search) where.title = { contains: params.search, mode: "insensitive" };
    if (params.status) where.status = params.status;
    if (params.promotionType) where.promotionType = params.promotionType as any;
    if (params.state === "RUNNING") and.push({ status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } });
    if (params.state === "SCHEDULED") and.push({ startDate: { gt: now } });
    if (params.state === "EXPIRED") and.push({ endDate: { lt: now } });
    if (and.length) where.AND = and;

    const [rows, total] = await Promise.all([
      prisma.promotion.findMany({ where, orderBy: [{ priority: "desc" }, { createdAt: "desc" }], skip, take }),
      prisma.promotion.count({ where }),
    ]);

    const promotions = rows.map((p) => ({
      ...serialize(p),
      state: getOfferState(p.status, p.startDate, p.endDate, now),
    }));

    return { promotions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  });
}

export async function getPromotionById(id: string) {
  return withAdmin(async () => {
    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new Error("Promotion not found");
    return { ...serialize(promo), state: getOfferState(promo.status, promo.startDate, promo.endDate) };
  });
}

export async function createPromotion(data: PromotionFormValues) {
  return withAdmin(async () => {
    const parsed = promotionSchema.parse(data);
    const { id: _omit, banner, ...rest } = parsed;
    const promo = await prisma.promotion.create({ data: { ...rest, banner: banner || null } });
    revalidatePath("/admin/marketing/promotions");
    return serialize(promo);
  });
}

export async function updatePromotion(id: string, data: PromotionFormValues) {
  return withAdmin(async () => {
    const parsed = promotionSchema.parse(data);
    const { id: _omit, banner, ...rest } = parsed;
    const promo = await prisma.promotion.update({ where: { id }, data: { ...rest, banner: banner || null } });
    revalidatePath("/admin/marketing/promotions");
    revalidatePath(`/admin/marketing/promotions/${id}`);
    return serialize(promo);
  });
}

export async function duplicatePromotion(id: string) {
  return withAdmin(async () => {
    const src = await prisma.promotion.findUnique({ where: { id } });
    if (!src) throw new Error("Promotion not found");
    const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = src;
    const promo = await prisma.promotion.create({
      data: { ...rest, title: `${src.title} (Copy)`, status: "INACTIVE" },
    });
    revalidatePath("/admin/marketing/promotions");
    return serialize(promo);
  });
}

export async function deletePromotion(id: string) {
  return withAdmin(async () => {
    await prisma.promotion.delete({ where: { id } });
    revalidatePath("/admin/marketing/promotions");
    return { id };
  });
}

export async function bulkDeletePromotions(ids: string[]) {
  return withAdmin(async () => {
    await prisma.promotion.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/marketing/promotions");
    return { count: ids.length };
  });
}

export async function bulkSetPromotionStatus(ids: string[], status: "ACTIVE" | "INACTIVE") {
  return withAdmin(async () => {
    await prisma.promotion.updateMany({ where: { id: { in: ids } }, data: { status } });
    revalidatePath("/admin/marketing/promotions");
    return { count: ids.length };
  });
}

/* ═════════════════════ FREE DELIVERY CAMPAIGNS ══════════════ */

export interface CampaignListParams {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  state?: "RUNNING" | "SCHEDULED" | "EXPIRED";
  page?: number;
  limit?: number;
}

export async function getCampaigns(params: CampaignListParams = {}) {
  return withAdmin(async () => {
    const { skip, take, page, limit } = paginate(params.page, params.limit);
    const now = new Date();
    const where: Prisma.FreeDeliveryCampaignWhereInput = {};
    const and: Prisma.FreeDeliveryCampaignWhereInput[] = [];

    if (params.search) where.name = { contains: params.search, mode: "insensitive" };
    if (params.status) where.status = params.status;
    if (params.state === "RUNNING") and.push({ status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } });
    if (params.state === "SCHEDULED") and.push({ startDate: { gt: now } });
    if (params.state === "EXPIRED") and.push({ endDate: { lt: now } });
    if (and.length) where.AND = and;

    const [rows, total] = await Promise.all([
      prisma.freeDeliveryCampaign.findMany({ where, orderBy: [{ priority: "desc" }, { createdAt: "desc" }], skip, take }),
      prisma.freeDeliveryCampaign.count({ where }),
    ]);

    const campaigns = rows.map((c) => ({
      ...serialize(c),
      state: getOfferState(c.status, c.startDate, c.endDate, now),
    }));

    return { campaigns, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  });
}

export async function getCampaignById(id: string) {
  return withAdmin(async () => {
    const c = await prisma.freeDeliveryCampaign.findUnique({ where: { id } });
    if (!c) throw new Error("Campaign not found");
    return { ...serialize(c), state: getOfferState(c.status, c.startDate, c.endDate) };
  });
}

export async function createCampaign(data: FreeDeliveryFormValues) {
  return withAdmin(async () => {
    const parsed = freeDeliverySchema.parse(data);
    const { id: _omit, ...rest } = parsed;
    const c = await prisma.freeDeliveryCampaign.create({ data: rest });
    revalidatePath("/admin/marketing/free-delivery");
    return serialize(c);
  });
}

export async function updateCampaign(id: string, data: FreeDeliveryFormValues) {
  return withAdmin(async () => {
    const parsed = freeDeliverySchema.parse(data);
    const { id: _omit, ...rest } = parsed;
    const c = await prisma.freeDeliveryCampaign.update({ where: { id }, data: rest });
    revalidatePath("/admin/marketing/free-delivery");
    revalidatePath(`/admin/marketing/free-delivery/${id}`);
    return serialize(c);
  });
}

export async function deleteCampaign(id: string) {
  return withAdmin(async () => {
    await prisma.freeDeliveryCampaign.delete({ where: { id } });
    revalidatePath("/admin/marketing/free-delivery");
    return { id };
  });
}

export async function bulkDeleteCampaigns(ids: string[]) {
  return withAdmin(async () => {
    await prisma.freeDeliveryCampaign.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/marketing/free-delivery");
    return { count: ids.length };
  });
}

export async function bulkSetCampaignStatus(ids: string[], status: "ACTIVE" | "INACTIVE") {
  return withAdmin(async () => {
    await prisma.freeDeliveryCampaign.updateMany({ where: { id: { in: ids } }, data: { status } });
    revalidatePath("/admin/marketing/free-delivery");
    return { count: ids.length };
  });
}

/* ═══════════════════════ MARKETING DASHBOARD ════════════════ */

export async function getMarketingStats() {
  return withAdmin(async () => {
    const now = new Date();

    const [
      activeCoupons,
      expiredCoupons,
      scheduledPromotions,
      runningPromotions,
      freeDeliveryCampaigns,
      couponUsageCount,
      discountAgg,
      topCouponGroup,
      recentUsages,
    ] = await Promise.all([
      prisma.coupon.count({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } } }),
      prisma.coupon.count({ where: { endDate: { lt: now } } }),
      prisma.promotion.count({ where: { status: "ACTIVE", startDate: { gt: now } } }),
      prisma.promotion.count({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } } }),
      prisma.freeDeliveryCampaign.count({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } } }),
      prisma.couponUsage.count(),
      prisma.couponUsage.aggregate({ _sum: { discount: true } }),
      prisma.couponUsage.groupBy({
        by: ["couponId"],
        _count: { couponId: true },
        _sum: { discount: true },
        orderBy: { _count: { couponId: "desc" } },
        take: 5,
      }),
      prisma.couponUsage.findMany({ orderBy: { usedAt: "desc" }, take: 200, select: { usedAt: true, discount: true } }),
    ]);

    // Resolve top coupon details
    const topIds = topCouponGroup.map((g) => g.couponId);
    const topCouponRows = topIds.length
      ? await prisma.coupon.findMany({ where: { id: { in: topIds } }, select: { id: true, code: true, name: true } })
      : [];
    const codeOf = new Map(topCouponRows.map((c) => [c.id, c]));
    const topCoupons = topCouponGroup.map((g) => ({
      couponId: g.couponId,
      code: codeOf.get(g.couponId)?.code ?? "—",
      name: codeOf.get(g.couponId)?.name ?? "",
      uses: g._count.couponId,
      discount: Number(g._sum.discount ?? 0),
    }));

    // Usage over the last 14 days (for the chart)
    const days = 14;
    const buckets: { date: string; uses: number; discount: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      buckets.push({ date: d.toISOString().slice(0, 10), uses: 0, discount: 0 });
    }
    const bucketIndex = new Map(buckets.map((b, i) => [b.date, i]));
    for (const u of recentUsages) {
      const key = u.usedAt.toISOString().slice(0, 10);
      const idx = bucketIndex.get(key);
      if (idx != null) {
        buckets[idx].uses += 1;
        buckets[idx].discount += Number(u.discount);
      }
    }

    return {
      cards: {
        activeCoupons,
        expiredCoupons,
        scheduledPromotions,
        runningPromotions,
        freeDeliveryCampaigns,
        couponUsageCount,
        totalDiscountGiven: Number(discountAgg._sum.discount ?? 0),
        mostUsedCoupon: topCoupons[0] ?? null,
      },
      topCoupons,
      usageTimeline: buckets.map((b) => ({ ...b, discount: Math.round(b.discount * 100) / 100 })),
    };
  });
}
