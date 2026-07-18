import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Prisma client or an interactive-transaction client. */
export type Db = Prisma.TransactionClient | typeof prisma;

const withDetail = {
  deliveries: { orderBy: { sequence: "asc" } },
  history: { orderBy: { createdAt: "desc" }, take: 30 },
} satisfies Prisma.SubscriptionInclude;

/** Thin data-access layer for subscriptions — no business logic lives here. */
export const subscriptionRepo = {
  listByUser(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      include: { deliveries: { orderBy: { sequence: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  },

  findForUser(userId: string, id: string) {
    return prisma.subscription.findFirst({ where: { id, userId }, include: withDetail });
  },

  create(db: Db, data: Prisma.SubscriptionUncheckedCreateInput) {
    return db.subscription.create({ data });
  },

  update(db: Db, id: string, data: Prisma.SubscriptionUncheckedUpdateInput) {
    return db.subscription.update({ where: { id }, data });
  },

  createDeliveries(db: Db, rows: Prisma.SubscriptionDeliveryUncheckedCreateInput[]) {
    return db.subscriptionDelivery.createMany({ data: rows });
  },

  scheduledDeliveries(db: Db, subscriptionId: string) {
    return db.subscriptionDelivery.findMany({
      where: { subscriptionId, status: "SCHEDULED" },
      orderBy: { sequence: "asc" },
    });
  },

  deleteDeliveries(db: Db, ids: string[]) {
    return db.subscriptionDelivery.deleteMany({ where: { id: { in: ids } } });
  },

  updateDeliveryStatus(db: Db, id: string, status: "SKIPPED" | "CANCELLED" | "DELIVERED") {
    return db.subscriptionDelivery.update({ where: { id }, data: { status } });
  },

  cancelFutureDeliveries(db: Db, subscriptionId: string) {
    return db.subscriptionDelivery.updateMany({
      where: { subscriptionId, status: "SCHEDULED" },
      data: { status: "CANCELLED" },
    });
  },

  maxSequence(db: Db, subscriptionId: string) {
    return db.subscriptionDelivery.aggregate({ where: { subscriptionId }, _max: { sequence: true } });
  },

  addHistory(db: Db, subscriptionId: string, action: Prisma.SubscriptionHistoryUncheckedCreateInput["action"], note?: string, metadata?: Prisma.InputJsonValue) {
    return db.subscriptionHistory.create({ data: { subscriptionId, action, note, metadata } });
  },

  addNotification(
    db: Db,
    userId: string,
    subscriptionId: string,
    type: Prisma.SubscriptionNotificationUncheckedCreateInput["type"],
    title: string,
    body?: string
  ) {
    return db.subscriptionNotification.create({ data: { userId, subscriptionId, type, title, body } });
  },
};
