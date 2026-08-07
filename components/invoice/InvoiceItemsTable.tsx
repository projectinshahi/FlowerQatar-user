import React from 'react';
import { InvoiceLineItem } from '@/lib/invoice/types';
import { formatCurrencyEn } from '@/lib/invoice/currency';

interface InvoiceItemsTableProps {
  items: InvoiceLineItem[];
  currencyCode?: string;
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
  items,
  currencyCode = 'QAR',
}) => {
  // Check if any item has variant information
  const hasVariants = items.some((item) => item.variantName || item.colorName);

  return (
    <section className="mb-6 overflow-hidden border border-[#EAEAEA] rounded-lg">
      <table className="w-full border-collapse text-left text-xs">
        {/* Minimal Soft Header */}
        <thead>
          <tr className="bg-[#FAFAFA] text-[#6B7280] border-b border-[#EAEAEA] text-[11px] font-medium">
            <th className="py-2.5 px-3 w-8 text-center">#</th>
            <th className="py-2.5 px-4 text-left">
              Product <span className="font-arabic font-normal text-[#9CA3AF]">| المنتج</span>
            </th>
            {hasVariants && (
              <th className="py-2.5 px-3 text-left w-28">
                Variant <span className="font-arabic font-normal text-[#9CA3AF]">| النوع</span>
              </th>
            )}
            <th className="py-2.5 px-3 text-center w-16">
              Qty <span className="font-arabic font-normal text-[#9CA3AF]">| الكمية</span>
            </th>
            <th className="py-2.5 px-3 text-right w-24">
              Unit Price <span className="font-arabic font-normal text-[#9CA3AF]">| السعر</span>
            </th>
            <th className="py-2.5 px-3 text-right w-20">
              VAT <span className="font-arabic font-normal text-[#9CA3AF]">| الضريبة</span>
            </th>
            <th className="py-2.5 px-4 text-right w-24">
              Total <span className="font-arabic font-normal text-[#9CA3AF]">| الإجمالي</span>
            </th>
          </tr>
        </thead>

        {/* Clean Minimal Rows */}
        <tbody className="divide-y divide-[#EAEAEA] bg-white text-[#2E2E2E]">
          {items.map((item, index) => {
            const rowNumber = item.itemNumber || index + 1;
            const variantText = item.variantName || item.colorName;

            return (
              <tr key={item.id || index} className="hover:bg-[#FAFAFA]/60 transition-colors">
                {/* Index */}
                <td className="py-3 px-3 text-center text-[#9CA3AF] font-mono text-[11px]">
                  {rowNumber}
                </td>

                {/* Product Name */}
                <td className="py-3 px-4">
                  <div className="font-medium text-[#2E2E2E] leading-snug">
                    {item.nameEn}
                  </div>
                  {item.nameAr && item.nameAr !== item.nameEn && (
                    <div className="font-arabic text-[11px] text-[#6B7280] mt-0.5" dir="rtl">
                      {item.nameAr}
                    </div>
                  )}
                </td>

                {/* Variant (if present) */}
                {hasVariants && (
                  <td className="py-3 px-3 text-[#6B7280] text-[11px]">
                    {variantText || '—'}
                  </td>
                )}

                {/* Quantity */}
                <td className="py-3 px-3 text-center font-mono font-medium text-[#2E2E2E]">
                  {item.quantity}
                </td>

                {/* Unit Price */}
                <td className="py-3 px-3 text-right font-mono text-[#6B7280] whitespace-nowrap">
                  {formatCurrencyEn(item.unitPrice, currencyCode)}
                </td>

                {/* VAT */}
                <td className="py-3 px-3 text-right font-mono text-[#6B7280] whitespace-nowrap">
                  {formatCurrencyEn(item.taxAmount, currencyCode)}
                </td>

                {/* Line Total */}
                <td className="py-3 px-4 text-right font-mono font-semibold text-[#2E2E2E] whitespace-nowrap">
                  {formatCurrencyEn(item.totalAmount, currencyCode)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};
