import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';

const PAGE_SIZE = 25;
const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const });

/** GET /api/admin/users?page=&q= — newest first, one page at a time, searched in the database. */
export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Math.floor(Number(searchParams.get('page'))) || 1);
    const q = searchParams.get('q')?.trim().slice(0, 100) ?? '';
    // Every word must match somewhere, so "jane doe" finds Jane Doe.
    const where: Prisma.UserWhereInput = q
      ? {
          AND: q.split(/\s+/).map((word) => ({
            OR: [{ firstName: contains(word) }, { lastName: contains(word) }, { email: contains(word) }],
          })),
        }
      : {};

    const [users, total] = await Promise.all([prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        lastLogin: true,
        // Membership + points snapshot for the admin (latest membership + wallet balances).
        pointsWallet: {
          select: { availablePoints: true, usedPoints: true, totalEarned: true, expiredPoints: true },
        },
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            status: true,
            startsAt: true,
            expiresAt: true,
            pointsCredited: true,
            plan: { select: { planType: true } },
          },
        },
      }
    }), prisma.user.count({ where })]);

    const now = Date.now();
    const shaped = users.map((u) => {
      const m = u.memberships[0] ?? null;
      const membership = m
        ? {
            plan: m.plan.planType, // SILVER | GOLD | PLATINUM
            // A membership is only truly active if not past its expiry.
            active: m.status === 'ACTIVE' && new Date(m.expiresAt).getTime() > now,
            status: m.status,
            startsAt: m.startsAt,
            expiresAt: m.expiresAt,
            pointsCredited: m.pointsCredited,
          }
        : null;
      const wallet = u.pointsWallet ?? { availablePoints: 0, usedPoints: 0, totalEarned: 0, expiredPoints: 0 };
      const { memberships, pointsWallet, ...rest } = u;
      void memberships;
      void pointsWallet;
      return { ...rest, membership, wallet };
    });

    return NextResponse.json({
      users: shaped,
      pagination: { page, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
