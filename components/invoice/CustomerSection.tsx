import React from 'react';
import { CustomerDetails } from '@/lib/invoice/types';

interface CustomerSectionProps {
  customer: CustomerDetails;
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({ customer }) => {
  const { name, email, phone, shippingAddress, billingAddress } = customer;
  const bill = billingAddress || shippingAddress;

  return (
    <section className="invoice-customer-block mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      
      {/* Bill To Card */}
      <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg p-4 space-y-1.5 text-xs text-[#6B7280]">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#EAEAEA]">
          <h3 className="font-semibold text-xs text-[#2E2E2E]">
            Bill To <span className="font-arabic font-normal text-[#6B7280]">| فاتورة إلى</span>
          </h3>
        </div>

        <div className="space-y-0.5 leading-relaxed pt-0.5">
          <p className="font-semibold text-[#2E2E2E] text-xs">{name}</p>
          <p>{bill.addressLine1}{bill.addressLine2 ? `, ${bill.addressLine2}` : ''}</p>
          <p>{bill.city}{bill.postalCode ? ` (${bill.postalCode})` : ''}, {bill.country}</p>
          <p className="text-[11px] pt-1 text-[#6B7280]">
            <span>{email}</span>
            {phone && <span className="font-mono text-[#2E2E2E] ml-2">· {phone}</span>}
          </p>
        </div>
      </div>

      {/* Ship To Card */}
      <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg p-4 space-y-1.5 text-xs text-[#6B7280]">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#EAEAEA]">
          <h3 className="font-semibold text-xs text-[#2E2E2E]">
            Ship To <span className="font-arabic font-normal text-[#6B7280]">| شحن إلى</span>
          </h3>
        </div>

        <div className="space-y-0.5 leading-relaxed pt-0.5">
          <p className="font-semibold text-[#2E2E2E] text-xs">{name}</p>
          <p>{shippingAddress.addressLine1}{shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ''}</p>
          <p>{shippingAddress.city}{shippingAddress.postalCode ? ` (${shippingAddress.postalCode})` : ''}, {shippingAddress.country}</p>
          <p className="text-[11px] pt-1 text-[#6B7280]">
            <span className="font-mono text-[#2E2E2E]">{phone || email}</span>
          </p>
        </div>
      </div>

    </section>
  );
};
