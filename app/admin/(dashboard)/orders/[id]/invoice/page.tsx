import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-guard';
import { getInvoiceDataByOrderId } from '@/lib/invoice/service';
import { InvoiceView } from '@/components/invoice/InvoiceView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax Invoice | Admin Portal | Lebami',
  description: 'View, verify and print customer invoice',
};

export default async function AdminOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  if (!id) notFound();

  const invoiceData = await getInvoiceDataByOrderId(id);

  return (
    <InvoiceView
      data={invoiceData}
      backHref="/admin/orders"
      backLabel="Back to Admin Orders"
      isAdmin={true}
    />
  );
}
