import React from 'react';
import { PaymentDetails, DeliveryDetails, OrderNotes } from '@/lib/invoice/types';

interface PaymentDeliveryDetailsProps {
  payment: PaymentDetails;
  delivery: DeliveryDetails;
  notes?: OrderNotes;
}

export const PaymentDeliveryDetails: React.FC<PaymentDeliveryDetailsProps> = ({
  payment,
  delivery,
  notes,
}) => {
  const hasNotes = Boolean(
    notes?.giftMessage || notes?.customerNotes || notes?.specialInstructions
  );

  return (
    <div className="space-y-4">
      {/* Payment & Delivery Grid */}
      <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg p-4 space-y-3 text-xs text-[#6B7280]">
        
        {/* Payment Section */}
        <div>
          <div className="pb-1 mb-1.5 border-b border-[#EAEAEA] flex items-center justify-between">
            <span className="font-semibold text-xs text-[#2E2E2E]">
              Payment <span className="font-arabic font-normal text-[#6B7280]">| الدفع</span>
            </span>
            <span className="text-[10px] font-medium text-emerald-700">
              {payment.statusLabelEn || 'Paid'}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Method | الطريقة:</span>
              <span className="text-[#2E2E2E] font-medium">
                {payment.methodLabelEn || 'Online Card'}
              </span>
            </div>

            {payment.transactionId && (
              <div className="flex justify-between">
                <span>Transaction ID | رقم المعاملة:</span>
                <span className="font-mono text-[#2E2E2E]">{payment.transactionId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Section */}
        <div className="pt-1.5 border-t border-[#EAEAEA]">
          <div className="pb-1 mb-1.5 border-b border-[#EAEAEA] flex items-center justify-between">
            <span className="font-semibold text-xs text-[#2E2E2E]">
              Delivery <span className="font-arabic font-normal text-[#6B7280]">| التوصيل</span>
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Courier | شركة الشحن:</span>
              <span className="text-[#2E2E2E] font-medium">{delivery.courier || 'Lebami Express'}</span>
            </div>

            {delivery.trackingNumber && (
              <div className="flex justify-between">
                <span>Tracking No. | رقم التتبع:</span>
                <span className="font-mono text-[#2E2E2E] font-medium">{delivery.trackingNumber}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Method | النوع:</span>
              <span className="text-[#2E2E2E]">{delivery.shippingMethod || 'Standard'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Notes Section - Hidden completely if empty */}
      {hasNotes && (
        <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg p-3 text-xs text-[#6B7280] space-y-1">
          <span className="font-semibold text-[11px] text-[#2E2E2E] block">
            Notes <span className="font-arabic font-normal text-[#6B7280]">| ملاحظات</span>
          </span>

          {notes?.giftMessage && (
            <p className="text-[11px] text-[#2E2E2E] italic">
              &ldquo;{notes.giftMessage}&rdquo;
            </p>
          )}

          {notes?.customerNotes && (
            <p className="text-[11px] text-[#6B7280]">
              {notes.customerNotes}
            </p>
          )}

          {notes?.specialInstructions && (
            <p className="text-[10px] text-[#9CA3AF]">
              {notes.specialInstructions}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
