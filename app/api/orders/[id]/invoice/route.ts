import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/admin-guard';
import { getCurrentCustomer } from '@/lib/customer-guard';
import { getInvoiceDataByOrderId, InvoiceServiceError } from '@/lib/invoice/service';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Check both admin and customer sessions (they are separate)
    const adminUser = await getCurrentUser();
    const customerUser = await getCurrentCustomer();

    // Verify access rights:
    // 1. Admin or Super Admin can access any order invoice (via admin session)
    // 2. Logged-in customer can access their own order invoice (via customer session)
    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAdmin = adminUser && (adminUser.role === 'ADMIN' || adminUser.role === 'SUPER_ADMIN');
    const isOwner = customerUser && order.userId && customerUser.id === order.userId;

    if (!isAdmin && !isOwner && order.userId) {
      return NextResponse.json({ error: 'Unauthorized to view this invoice' }, { status: 403 });
    }

    const invoiceData = await getInvoiceDataByOrderId(id);
    return NextResponse.json({ success: true, invoice: invoiceData });
  } catch (error) {
    console.error('Invoice API error:', error);
    if (error instanceof InvoiceServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: (error instanceof Error && error.message) || 'Failed to retrieve invoice' },
      { status: 500 }
    );
  }
}
