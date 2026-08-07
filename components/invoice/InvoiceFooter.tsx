import React from 'react';
import { CompanyDetails } from '@/lib/invoice/types';

interface InvoiceFooterProps {
  company: CompanyDetails;
  qrCodeUrl?: string;
}

export const InvoiceFooter: React.FC<InvoiceFooterProps> = ({
  company,
  qrCodeUrl,
}) => {
  return (
    <footer className="invoice-footer-block pt-5 mt-6 border-t border-[#EAEAEA] text-xs text-[#6B7280]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Thank You & Contact Info */}
        <div className="space-y-1 text-center sm:text-left">
          <p className="font-medium text-[#2E2E2E] text-xs">
            Thank you for your purchase. <span className="font-arabic font-normal text-[#6B7280]">| شكراً لثقتكم واختياركم.</span>
          </p>

          <p className="text-[11px] text-[#9CA3AF]">
            <span>Support: </span>
            <span className="text-[#6B7280]">{company.email} · {company.phone} · {company.website}</span>
          </p>

          <p className="text-[10px] text-[#9CA3AF] pt-0.5">
            This is a computer-generated invoice and does not require a signature.
            <span className="font-arabic block sm:inline sm:ml-1">| هذه فاتورة إلكترونية صادرة آلياً ولا تتطلب توقيعاً.</span>
          </p>
        </div>

        {/* Right: Verification QR Code */}
        {qrCodeUrl && (
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-14 h-14 bg-white p-1 rounded-md border border-[#EAEAEA] shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="Invoice QR"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-[9px] text-[#9CA3AF] leading-tight">
              <span className="font-medium text-[#2E2E2E] block">E-INVOICE</span>
              <span>Verify Online</span>
            </div>
          </div>
        )}

      </div>
    </footer>
  );
};
