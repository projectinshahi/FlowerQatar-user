import React from 'react';
import { InvoiceFinancials } from '@/lib/invoice/types';
import { formatCurrencyEn } from '@/lib/invoice/currency';

interface InvoiceSummaryProps {
  financials: InvoiceFinancials;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ financials }) => {
  const {
    subtotal,
    shippingFee,
    couponCode,
    couponDiscount,
    pointsRedeemed,
    pointsDiscount,
    taxAmount,
    grandTotal,
    paidAmount,
    remainingAmount,
    currencyCode = 'QAR',
  } = financials;

  const totalDiscount = (couponDiscount || 0) + (pointsDiscount || 0);

  return (
    <div className="invoice-summary-block w-full bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg p-4 space-y-2.5 text-xs text-[#6B7280]">
      {/* Title */}
      <div className="pb-1.5 border-b border-[#EAEAEA] flex items-center justify-between">
        <span className="font-semibold text-xs text-[#2E2E2E]">
          Order Summary <span className="font-arabic font-normal text-[#6B7280]">| ملخص الطلب</span>
        </span>
      </div>

      {/* Subtotal */}
      <div className="flex justify-between items-center text-[11px]">
        <span>Subtotal | المجموع الفرعي</span>
        <span className="font-mono text-[#2E2E2E] font-medium">
          {formatCurrencyEn(subtotal, currencyCode)}
        </span>
      </div>

      {/* Discount (if any) */}
      {totalDiscount > 0 && (
        <div className="flex justify-between items-center text-[11px] text-emerald-700">
          <span>
            Discount | الخصم
            {couponCode && <span className="font-mono text-[10px] ml-1">({couponCode})</span>}
          </span>
          <span className="font-mono font-medium">
            −{formatCurrencyEn(totalDiscount, currencyCode)}
          </span>
        </div>
      )}

      {/* Shipping */}
      <div className="flex justify-between items-center text-[11px]">
        <span>Shipping | الشحن</span>
        <span className="font-mono text-[#2E2E2E]">
          {shippingFee === 0 ? (
            <span className="text-emerald-700 font-medium">Free | مجاني</span>
          ) : (
            formatCurrencyEn(shippingFee, currencyCode)
          )}
        </span>
      </div>

      {/* VAT (8%) */}
      <div className="flex justify-between items-center text-[11px]">
        <span>VAT (8%) | الضريبة</span>
        <span className="font-mono text-[#2E2E2E]">
          {formatCurrencyEn(taxAmount, currencyCode)}
        </span>
      </div>

      {/* Grand Total - Highlighted */}
      <div className="border-t border-[#EAEAEA] pt-2 mt-1 flex justify-between items-baseline">
        <span className="font-semibold text-sm text-[#2E2E2E]">
          Grand Total <span className="font-arabic font-normal text-xs text-[#6B7280]">| الإجمالي</span>
        </span>
        <span className="font-mono text-lg font-bold text-[#61000B]">
          {formatCurrencyEn(grandTotal, currencyCode)}
        </span>
      </div>

      {/* Paid / Balance Note (if relevant) */}
      {(paidAmount > 0 || remainingAmount > 0) && (
        <div className="border-t border-[#EAEAEA]/80 pt-1.5 flex justify-between items-center text-[10px] text-[#9CA3AF]">
          <span>Paid: {formatCurrencyEn(paidAmount, currencyCode)}</span>
          <span>Balance Due: {formatCurrencyEn(remainingAmount, currencyCode)}</span>
        </div>
      )}
    </div>
  );
};
