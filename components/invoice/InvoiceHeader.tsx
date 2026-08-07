import React from 'react';
import { InvoiceData } from '@/lib/invoice/types';
import { formatDateEn } from '@/lib/invoice/date';

interface InvoiceHeaderProps {
  data: InvoiceData;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ data }) => {
  const { company, invoiceNumber, orderNumber, invoiceDate, payment, orderStatus } = data;

  return (
    <header className="pb-6 mb-6 border-b border-[#EAEAEA]">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
        
        {/* Left: Brand Identity & Company Info */}
        <div className="space-y-2 max-w-sm">
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={company.logoUrl || '/images/lebami.png'}
              alt="Lebami"
              className="h-9 w-auto object-contain"
            />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-base tracking-tight text-[#2E2E2E]">
                  Lebami
                </span>
                <span className="font-arabic text-sm font-medium text-[#6B7280]">
                  ليبامي
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Luxury Flowers & Gifts <span className="font-arabic">| زهور وهدايا فاخرة</span>
              </p>
            </div>
          </div>

          {/* Company Details (Neutral, Clean) */}
          <div className="text-[11px] text-[#6B7280] leading-relaxed pt-1 space-y-0.5">
            <p>{company.addressEn}, {company.cityEn}, {company.countryEn}</p>
            <p>
              <span>TRN | الرقم الضريبي: </span>
              <span className="font-mono text-[#2E2E2E] font-medium">{company.trn}</span>
            </p>
            <p className="text-[10px] text-[#9CA3AF]">
              {company.email} · {company.phone} · {company.website}
            </p>
          </div>
        </div>

        {/* Right: Invoice Title & Meta */}
        <div className="w-full sm:w-auto flex flex-col sm:items-end text-left sm:text-right">
          
          {/* Main Title: INVOICE | فاتورة */}
          <div className="mb-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#61000B] uppercase">
              INVOICE <span className="font-arabic font-normal text-lg sm:text-xl text-[#61000B]/80">| فاتورة</span>
            </h1>
          </div>

          {/* Clean Key-Value Rows */}
          <div className="space-y-1.5 text-xs text-[#6B7280] w-full sm:w-auto">
            
            {/* Invoice Number */}
            <div className="flex justify-between sm:justify-end gap-3 items-baseline">
              <span className="text-[11px]">Invoice No. | رقم الفاتورة:</span>
              <span className="font-mono font-semibold text-[#2E2E2E]">{invoiceNumber}</span>
            </div>

            {/* Order Number */}
            <div className="flex justify-between sm:justify-end gap-3 items-baseline">
              <span className="text-[11px]">Order No. | رقم الطلب:</span>
              <span className="font-mono text-[#2E2E2E]">{orderNumber}</span>
            </div>

            {/* Invoice Date */}
            <div className="flex justify-between sm:justify-end gap-3 items-baseline">
              <span className="text-[11px]">Date | التاريخ:</span>
              <span className="text-[#2E2E2E]">{formatDateEn(invoiceDate)}</span>
            </div>

            {/* Badges: Payment & Order Status */}
            <div className="flex justify-between sm:justify-end gap-2 pt-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                {payment.statusLabelEn || 'Paid'} | {payment.statusLabelAr || 'مدفوع'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAFAFA] text-[#4B5563] border border-[#EAEAEA]">
                {orderStatus}
              </span>
            </div>

          </div>

        </div>

      </div>
    </header>
  );
};
