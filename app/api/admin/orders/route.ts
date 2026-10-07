import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';

const PAGE_SIZE = 25;
const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const });

/** GET /api/admin/orders?page=&q= — newest first, one page at a time, searched in the database. */
export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Math.floor(Number(searchParams.get('page'))) || 1);
    const q = searchParams.get('q')?.trim().slice(0, 100) ?? '';

    const where: Prisma.OrderWhereInput = {};
    if (q) {
      // Ids are UUID columns, so the 8-character reference the list shows is matched as text.
      const idMatches = /^[0-9a-f-]{4,36}$/i.test(q)
        ? await prisma.$queryRaw<{ id: string }[]>`
            SELECT id FROM "Order" WHERE id::text ILIKE ${`${q.toLowerCase()}%`} LIMIT 50`
        : [];
      // Every word must match somewhere, so "jane doe" finds Jane Doe.
      const words = q.split(/\s+/).map((word) => ({
        OR: [
          { user: { firstName: contains(word) } },
          { user: { lastName: contains(word) } },
          { user: { email: contains(word) } },
          { trackingNumber: contains(word) },
        ],
      }));
      where.OR = [{ AND: words }, ...(idMatches.length ? [{ id: { in: idMatches.map((r) => r.id) } }] : [])];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          items: { include: { product: { select: { name: true, slug: true } } } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
