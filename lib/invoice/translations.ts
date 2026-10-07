/**
 * Clean, minimal bilingual English-Arabic dictionary for the luxury Lebami invoice system.
 * Formatted with modern paired labels: "English | عربي"
 */

export interface DualLabel {
  en: string;
  ar: string;
}

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
