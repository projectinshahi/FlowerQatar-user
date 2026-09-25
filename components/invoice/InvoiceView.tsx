'use client';

import React, { useState } from 'react';
import { InvoiceData } from '@/lib/invoice/types';
import { InvoiceDocument } from './InvoiceDocument';
import { Printer, ArrowLeft, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { downloadInvoicePdf } from '@/lib/invoice/download';

interface InvoiceViewProps {
  data: InvoiceData;
  backUrl?: string;
  backHref?: string;
  backLabel?: string;
  isAdmin?: boolean;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  data,
  backUrl,
  backHref,
  backLabel = 'Back to Orders',
  isAdmin = false,
}) => {
  const returnUrl = backHref || backUrl || (isAdmin ? '/admin/orders' : '/account/orders');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById('invoice-printable-document');
      if (!element) throw new Error('Invoice document is not on the page');
      await downloadInvoicePdf(element, data.invoiceNumber || data.orderNumber || 'INVOICE');
    } catch (error) {
      console.error('PDF export error, falling back to window.print():', error);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-screen-preview bg-[#F8F9FA] min-h-screen py-8 px-4 font-invoice">
      
      {/* Clean Top Action Bar */}
      <div className="no-print max-w-[210mm] mx-auto mb-6 flex items-center justify-between">
        
        {/* Back Link */}
        <Link
          href={returnUrl}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#2E2E2E] transition-colors"
        >
          <ArrowLeft size={15} />
          <span>{backLabel}</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#61000B] hover:bg-[#7A000E] text-white rounded-md text-xs font-medium transition-all shadow-xs disabled:opacity-70 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-[#2E2E2E] border border-[#EAEAEA] rounded-md text-xs font-medium transition-all cursor-pointer"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
        </div>

      </div>

      {/* Invoice Document Body */}
      <div className="max-w-[210mm] mx-auto">
        <InvoiceDocument data={data} />
      </div>

    </div>
  );
};
