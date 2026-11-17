import { notFound, redirect } from 'next/navigation';
import { getInvoiceDataByOrderId } from '@/lib/invoice/service';
import { getCurrentUser } from '@/lib/admin-guard';
import { getCurrentCustomer } from '@/lib/customer-guard';
import { prisma } from '@/lib/prisma';
import { InvoiceView } from '@/components/invoice/InvoiceView';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Tax Invoice #${id.slice(0, 8).toUpperCase()} | Lebami`,
    description: 'View and download official bilingual tax invoice',
  };
}

export default async function CustomerInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();

  // Check both admin and customer sessions (they are separate)
  const adminUser = await getCurrentUser();
  const customerUser = await getCurrentCustomer();

  const order = await prisma.order.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!order) {
    notFound();
  }

  const isAdmin = adminUser && (adminUser.role === 'ADMIN' || adminUser.role === 'SUPER_ADMIN');
  const isOwner = customerUser && order.userId && customerUser.id === order.userId;

  // If order belongs to a registered customer, require customer login / ownership or admin access
  if (order.userId && !isOwner && !isAdmin) {
    if (!customerUser && !adminUser) {
      redirect('/account');
    }
    notFound();
  }

  const invoiceData = await getInvoiceDataByOrderId(id);

  return (
    <InvoiceView
      data={invoiceData}
      backHref="/account/orders"
      backLabel="Back to My Orders"
    />
  );
}
