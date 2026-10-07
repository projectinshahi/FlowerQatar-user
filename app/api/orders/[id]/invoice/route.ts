import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/admin-guard';
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

    const user = await getCurrentUser();

    // Verify access rights:
    // 1. Admin or Super Admin can access any order invoice
    // 2. Logged-in user can access their own order invoice
    // 3. Guest with valid order access
    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    const isOwner = user && order.userId && user.id === order.userId;

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
