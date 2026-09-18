import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInvoiceDataByOrderId } from '@/lib/invoice/service';
import { formatCurrencyEn } from '@/lib/invoice/currency';
import { formatDateEn, formatDateAr } from '@/lib/invoice/date';
import { ShieldCheck, CheckCircle2, Building2, User, FileText, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoice Authenticity Verification',
  description: 'Official Tax Invoice Verification System',
  robots: { index: false, follow: false },
};

export default async function VerifyInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();

  let invoiceData;
  try {
    invoiceData = await getInvoiceDataByOrderId(id);
  } catch {
    notFound();
  }

  const { invoiceNumber, invoiceDate, company, customer, financials, payment, orderId } = invoiceData;

  return (
    <div className="min-h-screen bg-[#FFF6F0]/40 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        
        {/* Verification Card */}
        <div className="bg-white rounded-2xl border border-[#E8D8D8] shadow-lg overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-xs border border-white/20">
              <ShieldCheck className="w-9 h-9 text-emerald-200" />
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase">
              Official Tax Invoice Verified
            </h1>
            <p className="font-arabic text-sm font-semibold text-emerald-100 mt-1" dir="rtl">
              فاتورة ضريبية رسمية معتمدة وموثقة
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 text-xs font-mono text-emerald-200 border border-emerald-400/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authenticity Confirmed · موثقة إلكترونياً</span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 text-sm text-[#374151]">
            
            {/* Invoice Info Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Invoice Number / رقم الفاتورة
                </span>
                <span className="font-mono font-bold text-gray-900">{invoiceNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Date / التاريخ
                </span>
                <span className="text-gray-900 font-medium">{formatDateEn(invoiceDate)}</span>
              </div>
            </div>

            {/* Entity Details */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
              {/* Seller */}
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-[#61000B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-gray-500 block">Issued By / الجهة المصدرة</span>
                  <span className="font-bold text-gray-900">{company.nameEn}</span>
                  <span className="text-xs text-gray-600 block font-arabic" dir="rtl">{company.nameAr}</span>
                  <span className="text-xs text-gray-500 font-mono block mt-0.5">TRN: {company.trn}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="flex items-start gap-3 pt-2">
                <User className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-gray-500 block">Billed To / العميل</span>
                  <span className="font-semibold text-gray-900">{customer.name}</span>
                  <span className="text-xs text-gray-500 block">{customer.shippingAddress.city}, {customer.shippingAddress.country}</span>
                </div>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl space-y-2 border border-[#F0E6DD]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Subtotal / المجموع الفرعي:</span>
                <span className="font-mono font-medium">{formatCurrencyEn(financials.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Tax (VAT 8%) / الضريبة:</span>
                <span className="font-mono font-medium">{formatCurrencyEn(financials.taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Grand Total / الإجمالي:</span>
                <span className="font-mono text-base text-[#61000B]">{formatCurrencyEn(financials.grandTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-emerald-800 font-semibold pt-1">
                <span>Payment Status / حالة السداد:</span>
                <span>{payment.statusLabelEn} ({payment.statusLabelAr})</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <Link
                href={`/orders/${orderId}/invoice`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#61000B] hover:bg-[#800010] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all text-center"
              >
                <FileText className="w-4 h-4" />
                View Full Invoice Document
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
            Lebami E-Invoicing System · Powered by QR / ZATCA Standard Security
          </div>

        </div>

      </div>
    </div>
  );
}
