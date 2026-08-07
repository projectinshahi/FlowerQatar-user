/**
 * Clean, minimal bilingual English-Arabic dictionary for the luxury Lebami invoice system.
 * Formatted with modern paired labels: "English | عربي"
 */

export interface DualLabel {
  en: string;
  ar: string;
}

export function formatBilingual(en: string, ar: string, separator = ' | '): string {
  if (!ar) return en;
  if (!en) return ar;
  return `${en}${separator}${ar}`;
}

export const INVOICE_LABELS = {
  // Document Titles
  invoiceTitle: { en: "INVOICE", ar: "فاتورة" },
  taxInvoice: { en: "TAX INVOICE", ar: "فاتورة ضريبية" },
  
  // Header Meta
  invoiceNumber: { en: "Invoice No.", ar: "رقم الفاتورة" },
  orderNumber: { en: "Order No.", ar: "رقم الطلب" },
  invoiceDate: { en: "Date", ar: "التاريخ" },
  paymentStatus: { en: "Payment", ar: "الدفع" },
  orderStatus: { en: "Status", ar: "الحالة" },

  // Company Details
  tagline: { en: "Luxury Flowers & Gifts", ar: "زهور وهدايا فاخرة" },
  trn: { en: "TRN", ar: "الرقم الضريبي" },
  cr: { en: "CR", ar: "السجل التجاري" },
  phone: { en: "Phone", ar: "الهاتف" },
  email: { en: "Email", ar: "البريد" },
  website: { en: "Website", ar: "الموقع" },

  // Customer Section
  billTo: { en: "Bill To", ar: "فاتورة إلى" },
  shipTo: { en: "Ship To", ar: "شحن إلى" },
  customer: { en: "Customer", ar: "العميل" },

  // Table Columns
  itemNumber: { en: "#", ar: "م" },
  product: { en: "Product", ar: "المنتج" },
  variant: { en: "Variant", ar: "النوع" },
  quantity: { en: "Qty", ar: "الكمية" },
  unitPrice: { en: "Unit Price", ar: "سعر الوحدة" },
  taxVat: { en: "VAT", ar: "الضريبة" },
  total: { en: "Total", ar: "الإجمالي" },

  // Order Summary
  orderSummary: { en: "Order Summary", ar: "ملخص الطلب" },
  subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
  discount: { en: "Discount", ar: "الخصم" },
  shipping: { en: "Shipping", ar: "الشحن" },
  freeShipping: { en: "Free", ar: "مجاني" },
  vat: { en: "VAT (8%)", ar: "ضريبة القيمة المضافة" },
  grandTotal: { en: "Grand Total", ar: "الإجمالي" },
  amountPaid: { en: "Amount Paid", ar: "المدفوع" },
  remainingBalance: { en: "Balance Due", ar: "المتبقي" },

  // Payment & Delivery
  payment: { en: "Payment", ar: "الدفع" },
  paymentMethod: { en: "Payment Method", ar: "طريقة الدفع" },
  transactionId: { en: "Transaction ID", ar: "رقم المعاملة" },
  delivery: { en: "Delivery", ar: "التوصيل" },
  courier: { en: "Courier", ar: "شركة الشحن" },
  trackingNumber: { en: "Tracking No.", ar: "رقم التتبع" },
  deliveryMethod: { en: "Method", ar: "نوع الشحن" },
  
  // Notes
  orderNotes: { en: "Notes", ar: "ملاحظات" },
  giftMessage: { en: "Gift Message", ar: "رسالة الإهداء" },
  instructions: { en: "Special Instructions", ar: "تعليمات خاصة" },

  // Footer
  thankYou: { en: "Thank you for your purchase.", ar: "شكراً لثقتكم واختياركم ليبامي." },
  support: { en: "Customer Support", ar: "خدمة العملاء" },
  computerGenerated: {
    en: "This is a computer-generated invoice and does not require a signature.",
    ar: "هذه فاتورة إلكترونية صادرة آلياً ولا تتطلب توقيعاً."
  },
  qrCodeScan: { en: "Verify Authenticity", ar: "التحقق من الفاتورة" },
} as const;

export const STATUS_TRANSLATIONS: Record<string, DualLabel> = {
  PENDING: { en: "Pending", ar: "قيد الانتظار" },
  PROCESSING: { en: "Processing", ar: "قيد التجهيز" },
  SHIPPED: { en: "Shipped", ar: "تم الشحن" },
  DELIVERED: { en: "Delivered", ar: "تم التوصيل" },
  CANCELLED: { en: "Cancelled", ar: "ملغي" },
  PAID: { en: "Paid", ar: "مدفوع" },
  UNPAID: { en: "Unpaid", ar: "غير مدفوع" },
  REFUNDED: { en: "Refunded", ar: "مسترجع" },
};

export const PAYMENT_METHOD_TRANSLATIONS: Record<string, DualLabel> = {
  CARD: { en: "Credit / Debit Card", ar: "بطاقة بنكية" },
  POINTS: { en: "Loyalty Points", ar: "نقاط الولاء" },
  MIXED: { en: "Card + Loyalty Points", ar: "بطاقة + نقاط" },
  CASH: { en: "Cash on Delivery", ar: "الدفع عند الاستلام" },
  SIMULATED: { en: "Online Payment", ar: "دفع إلكتروني" },
};

export const SHIPPING_METHOD_TRANSLATIONS: Record<string, DualLabel> = {
  standard: { en: "Standard Delivery", ar: "توصيل قياسي" },
  courier: { en: "Express Courier", ar: "توصيل سريع" },
};

export const DEFAULT_COMPANY: import('./types').CompanyDetails = {
  nameEn: "Lebami",
  nameAr: "ليبامي",
  legalNameEn: "Lebami Florals W.L.L.",
  legalNameAr: "شركة ليبامي للزهور ذ.م.م",
  logoUrl: "/images/lebami.png",
  trn: "310492817400003",
  crNumber: "CR-948201",
  phone: "+974 4499 8822",
  email: "care@lebami.com",
  website: "www.lebami.com",
  addressEn: "Lusail Marina Promenade, Lusail",
  addressAr: "ممشى مارينا لوسيل، لوسيل",
  cityEn: "Doha",
  cityAr: "الدوحة",
  countryEn: "Qatar",
  countryAr: "قطر",
  postalCode: "PO Box 92831",
};
