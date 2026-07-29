import { prisma } from "@/lib/prisma";
import type { Prisma, WalletTxnType } from "@prisma/client";

/** Points redemption rate: 1 point = POINT_VALUE currency units (QAR). */
export const POINT_VALUE = 1;

export class WalletError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "WalletError";
    this.status = status;
  }
}

export interface WalletView {
  totalEarned: number;
  usedPoints: number;
  expiredPoints: number;
  availablePoints: number;
  updatedAt: Date | null;
}

type Db = Prisma.TransactionClient | typeof prisma;

/** Read-only wallet view — never creates a row (returns zeros for users with no wallet yet). */
export async function getWalletView(userId: string): Promise<WalletView> {
  const w = await prisma.pointsWallet.findUnique({ where: { userId } });
  return {
    totalEarned: w?.totalEarned ?? 0,
    usedPoints: w?.usedPoints ?? 0,
    expiredPoints: w?.expiredPoints ?? 0,
    availablePoints: w?.availablePoints ?? 0,
    updatedAt: w?.updatedAt ?? null,
  };
}

/** Get (or lazily create) a user's wallet. Always scoped to the authenticated user id. */
export async function getOrCreateWallet(userId: string, db: Db = prisma) {
  const existing = await db.pointsWallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.pointsWallet.create({ data: { userId } });
}

/**
 * Credit points to a user's wallet inside a caller-provided transaction, writing a ledger
 * entry. Used when a membership is purchased. No-op-safe for non-positive amounts.
 */
export async function creditPoints(
  userId: string,
  amount: number,
  opts: { type: WalletTxnType; reason: string; reference?: string },
  tx: Prisma.TransactionClient
): Promise<void> {
  if (!Number.isInteger(amount) || amount <= 0) return; // nothing to credit
  const wallet = await getOrCreateWallet(userId, tx);
  const before = wallet.availablePoints;
  const after = before + amount;
  await tx.pointsWallet.update({
    where: { id: wallet.id },
    data: { availablePoints: after, totalEarned: { increment: amount } },
  });
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: opts.type,
      beforeBalance: before,
      change: amount,
      afterBalance: after,
      reason: opts.reason,
      reference: opts.reference ?? null,
    },
  });
}

/**
 * Reverse a redemption (e.g. order cancelled) inside a caller-provided transaction: return the
 * points to availablePoints and undo usedPoints. NOT creditPoints — a refund is not "earned",
 * so totalEarned must not move. Ledgered as REFUND. No-op-safe for non-positive amounts.
 */
export async function refundPoints(
  userId: string,
  amount: number,
  opts: { reason: string; reference?: string },
  tx: Prisma.TransactionClient
): Promise<void> {
  if (!Number.isInteger(amount) || amount <= 0) return;
  const wallet = await tx.pointsWallet.findUnique({ where: { userId }, select: { id: true, availablePoints: true, usedPoints: true } });
  if (!wallet) return; // nothing to refund into
  const before = wallet.availablePoints;
  const after = before + amount;
  await tx.pointsWallet.update({
    where: { id: wallet.id },
    // Clamp usedPoints at 0 so a double-refund can't drive it negative.
    data: { availablePoints: after, usedPoints: Math.max(0, wallet.usedPoints - amount) },
  });
  await tx.walletTransaction.create({
    data: { walletId: wallet.id, type: "REFUND", beforeBalance: before, change: amount, afterBalance: after, reason: opts.reason, reference: opts.reference ?? null },
  });
}

export interface RedeemResult {
  redeemed: number;
  discount: number;
  remaining: number;
}

/**
 * Redeem points against an order inside a caller-provided transaction. Validates the amount
 * against the wallet balance AND the order value, then decrements ATOMICALLY (conditional
 * update) so two concurrent requests can never double-spend. Writes a ledger entry.
 */
export async function redeemPoints(
  userId: string,
  amount: number,
  orderTotal: number,
  opts: { reason: string; reference?: string },
  tx: Prisma.TransactionClient
): Promise<RedeemResult> {
  if (!Number.isInteger(amount)) throw new WalletError("Points must be a whole number");
  if (amount <= 0) throw new WalletError("Points must be greater than zero");

  const maxByOrder = Math.floor(orderTotal / POINT_VALUE);
  if (amount > maxByOrder) throw new WalletError("Redemption exceeds the order value");

  const wallet = await tx.pointsWallet.findUnique({
    where: { userId },
    select: { id: true, availablePoints: true },
  });
  if (!wallet) throw new WalletError("No points to redeem");
  if (amount > wallet.availablePoints) throw new WalletError("You don't have enough points");

  const before = wallet.availablePoints;
  // Atomic conditional decrement: only succeeds if the balance is still sufficient.
  const res = await tx.pointsWallet.updateMany({
    where: { id: wallet.id, availablePoints: { gte: amount } },
    data: { availablePoints: { decrement: amount }, usedPoints: { increment: amount } },
  });
  if (res.count !== 1) throw new WalletError("Your points changed — please try again", 409);

  const after = before - amount;
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "POINTS_REDEEMED",
      beforeBalance: before,
      change: -amount,
      afterBalance: after,
      reason: opts.reason,
      reference: opts.reference ?? null,
    },
  });

  return { redeemed: amount, discount: amount * POINT_VALUE, remaining: after };
}
