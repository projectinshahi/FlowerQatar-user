import React from 'react';
import { InvoiceData } from '@/lib/invoice/types';
import { InvoiceHeader } from './InvoiceHeader';
import { CustomerSection } from './CustomerSection';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { InvoiceSummary } from './InvoiceSummary';
import { PaymentDeliveryDetails } from './PaymentDeliveryDetails';
import { InvoiceFooter } from './InvoiceFooter';
import './InvoicePrintStyles.css';

interface InvoiceDocumentProps {
  data: InvoiceData;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ data }) => {
  return (
    <div
      id="invoice-printable-document"
      className="invoice-page-container invoice-page-card font-invoice"
    >
      {/* 1. Header with Official Lebami Logo & Invoice Meta */}
      <InvoiceHeader data={data} />

      {/* 2. Customer Details: Bill To & Ship To Cards */}
      <CustomerSection customer={data.customer} />

      {/* 3. Minimal Clean Product Table */}
      <InvoiceItemsTable
        items={data.items}
        currencyCode={data.financials.currencyCode}
      />

      {/* 4. Payment/Delivery Information (Left) + Order Financial Summary (Right) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 items-start">
        <PaymentDeliveryDetails
          payment={data.payment}
          delivery={data.delivery}
          notes={data.notes}
        />
        <InvoiceSummary
          financials={data.financials}
        />
      </div>

      {/* 5. Minimal Footer with Verification QR Code */}
      <InvoiceFooter
        company={data.company}
        qrCodeUrl={data.qrCodeUrl}
      />
    </div>
  );
};
