import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api";
import type {
  CreateSubscriptionInput,
  PauseSubscriptionInput,
  SkipDeliveryInput,
  CancelSubscriptionInput,
} from "@/lib/validations/subscription";
import { subscriptionRepo } from "./repository";
import {
  generateDeliveryDates,
  nextOccurrence,
  frequencyLabel,
  toUtcDate,
  type RecurrenceConfig,
} from "./schedule";

/* ─────────────── helpers ─────────────── */

const fmt = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
const todayUtc = () => toUtcDate(new Date());
const parseDate = (s: string) => new Date(`${s}T00:00:00Z`);

interface VariantJson {
  id?: string;
  variantName?: string;
  colorVariants?: ColorJson[];
}
interface ColorJson {
  id?: string;
  colorName?: string;
  price?: number;
  salePrice?: number | null;
  swatchImage?: string;
  hoverImage?: string;
  galleryImages?: { url?: string }[];
}

export function resolveProduct(product: { name: string; variants: unknown }, variantId?: string | null, colorId?: string | null) {
  const variants: VariantJson[] = Array.isArray(product.variants) ? (product.variants as VariantJson[]) : [];
  const variant = (variantId && variants.find((v) => v?.id === variantId)) || variants[0];
  const colors = variant?.colorVariants || [];
  const color = (colorId && colors.find((c) => c?.id === colorId)) || colors[0];
  const price = Number(color?.salePrice ?? color?.price ?? 0);
  const gallery = (color?.galleryImages || []).map((g) => g?.url).filter(Boolean) as string[];
  const image = gallery[0] || color?.swatchImage || color?.hoverImage || null;
  const label = [variant?.variantName, color?.colorName].filter(Boolean).join(" · ") || null;
  return { unitPrice: price, productName: product.name, productImage: image, variantLabel: label };
}

interface AddressJson {
  id?: string;
  isDefault?: boolean;
}
function resolveAddress(raw: unknown, addressId?: string | null): Prisma.InputJsonValue | null {
  const list = (Array.isArray(raw) ? raw : []) as AddressJson[];
  if (!list.length) return null;
  const found = addressId ? list.find((a) => a?.id === addressId) : list.find((a) => a?.isDefault) || list[0];
  return (found as Prisma.InputJsonValue) ?? null;
}

const cfgOf = (s: {
  frequency: RecurrenceConfig["frequency"];
  intervalCount: number;
  weekday: number | null;
  monthDate: number | null;
}): RecurrenceConfig => ({
  frequency: s.frequency,
  intervalCount: s.intervalCount,
  weekday: s.weekday,
  monthDate: s.monthDate,
});

type SubWithDetail = NonNullable<Awaited<ReturnType<typeof subscriptionRepo.findForUser>>>;

/** Convert Decimal + add derived fields for the client. */
function decorate(sub: SubWithDetail) {
  const deliveries = sub.deliveries ?? [];
  const scheduled = deliveries.filter((d) => d.status === "SCHEDULED");
  const unitPrice = Number(sub.unitPrice);
  return {
    ...sub,
    unitPrice,
    totalPrice: unitPrice * sub.quantity,
    remainingDeliveries: scheduled.length,
    deliveredCount: deliveries.filter((d) => d.status === "DELIVERED").length,
    skippedCount: deliveries.filter((d) => d.status === "SKIPPED").length,
    frequencyLabel: frequencyLabel(cfgOf(sub)),
  };
}

async function mustOwn(userId: string, id: string): Promise<SubWithDetail> {
  const sub = await subscriptionRepo.findForUser(userId, id);
  if (!sub) throw new ApiError("Subscription not found", 404);
  return sub;
}

/* ─────────────── operations ─────────────── */

export async function listSubscriptions(userId: string) {
  const subs = await subscriptionRepo.listByUser(userId);
  return subs.map((s) => decorate(s as SubWithDetail));
}

export async function getSubscription(userId: string, id: string) {
  return decorate(await mustOwn(userId, id));
}

export async function createSubscription(userId: string, input: CreateSubscriptionInput) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, status: "PUBLISHED" },
    select: { id: true, name: true, variants: true },
  });
  if (!product) throw new ApiError("Product not found or unavailable", 404);

  const pricing = resolveProduct(product, input.variantId, input.colorId);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { addresses: true } });
  const address = resolveAddress(user?.addresses, input.addressId);
  if (!address) throw new ApiError("Please add a delivery address before subscribing", 400);

  const cfg = cfgOf({
    frequency: input.frequency,
    intervalCount: input.intervalCount,
    weekday: input.weekday ?? null,
    monthDate: input.monthDate ?? null,
  });
  const dates = generateDeliveryDates(parseDate(input.startDate), cfg, input.totalDeliveries ?? null);
  if (!dates.length) throw new ApiError("Could not build a delivery schedule", 422);

  const created = await prisma.$transaction(async (tx) => {
    const sub = await subscriptionRepo.create(tx, {
      userId,
      productId: product.id,
      variantId: input.variantId ?? null,
      colorId: input.colorId ?? null,
      productName: pricing.productName,
      productImage: pricing.productImage,
      variantLabel: pricing.variantLabel,
      quantity: input.quantity,
      unitPrice: pricing.unitPrice,
      discountPercent: input.discountPercent ?? 0,
      frequency: input.frequency,
      intervalCount: input.intervalCount,
      weekday: input.weekday ?? null,
      monthDate: input.monthDate ?? null,
      totalDeliveries: input.totalDeliveries ?? null,
      startDate: dates[0],
      endDate: input.totalDeliveries ? dates[dates.length - 1] : null,
      nextDeliveryDate: dates[0],
      status: "ACTIVE",
      deliveryAddress: address,
    });
    await subscriptionRepo.createDeliveries(
      tx,
      dates.map((d, i) => ({ subscriptionId: sub.id, sequence: i + 1, scheduledDate: d, status: "SCHEDULED" }))
    );
    await subscriptionRepo.addHistory(tx, sub.id, "CREATED", `Created with ${dates.length} scheduled deliveries`);
    await subscriptionRepo.addNotification(
      tx,
      userId,
      sub.id,
      "SUBSCRIPTION_CREATED",
      "Subscription created",
      `${pricing.productName} — ${frequencyLabel(cfg)}`
    );
    return sub;
  });

  return getSubscription(userId, created.id);
}

export async function pauseSubscription(userId: string, id: string, input: PauseSubscriptionInput) {
  const sub = await mustOwn(userId, id);
  if (sub.status !== "ACTIVE") throw new ApiError("Only active subscriptions can be paused", 409);

  await prisma.$transaction(async (tx) => {
    await subscriptionRepo.update(tx, id, {
      status: "PAUSED",
      pausedAt: new Date(),
      resumeDate: input.resumeDate ? parseDate(input.resumeDate) : null,
    });
    await subscriptionRepo.addHistory(tx, id, "PAUSED", input.reason ?? undefined);
    await subscriptionRepo.addNotification(
      tx,
      userId,
      id,
      "SUBSCRIPTION_PAUSED",
      "Subscription paused",
      input.resumeDate ? `Scheduled to resume on ${input.resumeDate}` : undefined
    );
  });

  return getSubscription(userId, id);
}

export async function resumeSubscription(userId: string, id: string) {
  const sub = await mustOwn(userId, id);
  if (sub.status !== "PAUSED") throw new ApiError("Only paused subscriptions can be resumed", 409);

  const remaining = sub.deliveries.filter((d) => d.status === "SCHEDULED");
  const anchor = sub.resumeDate && toUtcDate(sub.resumeDate) > todayUtc() ? toUtcDate(sub.resumeDate) : todayUtc();
  const cfg = cfgOf(sub);

  await prisma.$transaction(async (tx) => {
    if (remaining.length) {
      await subscriptionRepo.deleteDeliveries(tx, remaining.map((d) => d.id));
      const maxSeq = (await subscriptionRepo.maxSequence(tx, id))._max.sequence ?? 0;
      const dates = generateDeliveryDates(anchor, cfg, remaining.length);
      await subscriptionRepo.createDeliveries(
        tx,
        dates.map((d, i) => ({ subscriptionId: id, sequence: maxSeq + i + 1, scheduledDate: d, status: "SCHEDULED" }))
      );
      await subscriptionRepo.update(tx, id, {
        status: "ACTIVE",
        pausedAt: null,
        resumeDate: null,
        nextDeliveryDate: dates[0],
        endDate: sub.totalDeliveries ? dates[dates.length - 1] : null,
      });
    } else {
      await subscriptionRepo.update(tx, id, { status: "ACTIVE", pausedAt: null, resumeDate: null });
    }
    await subscriptionRepo.addHistory(tx, id, "RESUMED", "Remaining deliveries rescheduled");
    await subscriptionRepo.addNotification(tx, userId, id, "SUBSCRIPTION_RESUMED", "Subscription resumed");
  });

  return getSubscription(userId, id);
}

export async function skipDelivery(userId: string, id: string, input: SkipDeliveryInput) {
  const sub = await mustOwn(userId, id);
  if (sub.status !== "ACTIVE") throw new ApiError("Only active subscriptions can skip a delivery", 409);

  const scheduled = [...sub.deliveries.filter((d) => d.status === "SCHEDULED")].sort(
    (a, b) => +a.scheduledDate - +b.scheduledDate
  );
  const target = input.deliveryId ? scheduled.find((d) => d.id === input.deliveryId) : scheduled[0];
  if (!target) throw new ApiError("No upcoming delivery to skip", 404);

  await prisma.$transaction(async (tx) => {
    await subscriptionRepo.updateDeliveryStatus(tx, target.id, "SKIPPED");

    // Bounded subscriptions: append one delivery at the end so the promised count is preserved.
    if (sub.totalDeliveries) {
      const last = [...sub.deliveries].sort((a, b) => a.sequence - b.sequence).at(-1)!;
      const nextDate = nextOccurrence(toUtcDate(last.scheduledDate), cfgOf(sub));
      await subscriptionRepo.createDeliveries(tx, [
        { subscriptionId: id, sequence: last.sequence + 1, scheduledDate: nextDate, status: "SCHEDULED" },
      ]);
      await subscriptionRepo.update(tx, id, { endDate: nextDate });
    }

    const nextSched = scheduled.find((d) => d.id !== target.id)?.scheduledDate ?? null;
    await subscriptionRepo.update(tx, id, { nextDeliveryDate: nextSched });
    await subscriptionRepo.addHistory(tx, id, "SKIPPED", `Skipped delivery on ${fmt(target.scheduledDate)}`);
    await subscriptionRepo.addNotification(tx, userId, id, "DELIVERY_SKIPPED", "Delivery skipped", `Delivery on ${fmt(target.scheduledDate)} was skipped`);
  });

  return getSubscription(userId, id);
}

export async function cancelSubscription(userId: string, id: string, input: CancelSubscriptionInput) {
  const sub = await mustOwn(userId, id);
  if (sub.status === "CANCELLED") throw new ApiError("Subscription is already cancelled", 409);

  await prisma.$transaction(async (tx) => {
    await subscriptionRepo.cancelFutureDeliveries(tx, id);
    await subscriptionRepo.update(tx, id, {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: input.reason ?? null,
      nextDeliveryDate: null,
    });
    await subscriptionRepo.addHistory(tx, id, "CANCELLED", input.reason ?? undefined);
    await subscriptionRepo.addNotification(tx, userId, id, "SUBSCRIPTION_CANCELLED", "Subscription cancelled");
  });

  return getSubscription(userId, id);
}
