import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';

export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
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
    });

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

    return NextResponse.json({ users: shaped });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
