import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { cancelOrder, OrderError } from '@/lib/services/order';
import { notifyUser } from '@/lib/live-sync';

// Allowed forward transitions; anything else (e.g. DELIVERED → PENDING) is rejected.
const TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

// Column widths: Order.trackingNumber VarChar(100), Order.cancelReason VarChar(255).
const patchSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  trackingNumber: z.string().trim().max(100, 'Tracking number is too long').nullable().optional(),
  cancelReason: z.string().trim().max(255, 'Cancellation reason is too long').optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? 'Invalid request',
          fieldErrors: z.flattenError(parsed.error).fieldErrors,
        },
        { status: 400 }
      );
    }
    const { status, trackingNumber, cancelReason } = parsed.data;

    const current = await prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (status && status !== current.status && !TRANSITIONS[current.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${current.status} to ${status}` },
        { status: 400 }
      );
    }

    // Cancelling must refund redeemed points — route through the shared service, not a raw update.
    if (status === 'CANCELLED' && current.status !== 'CANCELLED') {
      await cancelOrder(id, { reason: cancelReason });
      if (trackingNumber !== undefined) {
        await prisma.order.update({ where: { id }, data: { trackingNumber } });
      }
      const order = await prisma.order.findUnique({ where: { id } });
      // Private: only the customer who owns the order hears about it (their user room).
      if (order) notifyUser(order.userId, { type: 'order.statusChanged', ids: [id], status: order.status });
      return NextResponse.json({ message: 'Order updated successfully', order });
    }

    const order = await prisma.order.update({
      where: {
        id,
      },
      data: {
        status,
        trackingNumber,
      },
    });

    notifyUser(order.userId, { type: 'order.statusChanged', ids: [id], status: order.status });
    return NextResponse.json({ message: 'Order updated successfully', order });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
