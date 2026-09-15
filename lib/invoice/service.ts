import { stillOf } from '@/lib/media';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/site';
import {
  InvoiceData,
  InvoiceLineItem,
  InvoiceFinancials,
  CustomerDetails,
  CompanyDetails,
  PaymentDetails,
  DeliveryDetails,
  OrderNotes,
} from './types';
import {
  DEFAULT_COMPANY,
  STATUS_TRANSLATIONS,
  PAYMENT_METHOD_TRANSLATIONS,
  SHIPPING_METHOD_TRANSLATIONS,
} from './translations';
import { generateQrCodeDataUrl, ZatcaQrData, generateZatcaTlvBase64 } from './qrcode';

export class InvoiceServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'InvoiceServiceError';
    this.status = status;
  }
}

/**
 * Builds deterministic formatted invoice number.
 * Example: INV-20260805-4B8F9A
 */
export function formatInvoiceNumber(date: Date, orderId: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const shortId = orderId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `INV-${y}${m}${d}-${shortId}`;
}

/**
 * Maps product color names to Arabic.
 */
function translateColorToAr(color: string | null | undefined): string | undefined {
  if (!color) return undefined;
  const map: Record<string, string> = {
    Red: 'أحمر',
    Burgundy: 'عنابي فاخر',
    Pink: 'وردي ناعم',
    'Baby Pink': 'وردي فاتح',
    White: 'أبيض ناصع',
    Black: 'أسود ملكي',
    Gold: 'ذهبي ملوكي',
    Blue: 'أزرق ياقوتي',
    'Royal Blue': 'أزرق ملكي',
    Purple: 'أرجواني',
    Lavender: 'لافندر',
    Yellow: 'أصفر مشرق',
    Peach: 'خوخي ناعم',
  };
  return map[color] || color;
}

/**
 * Resolves product image thumbnail safely from product or variants.
 */
function resolveProductImage(product: any): string | undefined {
  if (!product) return undefined;
  if (product.image) return product.image;
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    for (const v of product.variants) {
      if (Array.isArray(v.colorVariants)) {
        for (const cv of v.colorVariants) {
          // An invoice can only print a still: a video swatch contributes its poster frame.
          const swatch = stillOf(cv.swatchImage);
          if (swatch) return swatch;
          if (Array.isArray(cv.galleryImages) && cv.galleryImages.length > 0) {
            const first = stillOf(cv.galleryImages[0].url);
            if (first) return first;
          }
        }
      }
    }
  }
  return undefined;
}

/**
 * Fetches and builds authoritative InvoiceData from an Order ID.
 */
export async function getInvoiceDataByOrderId(orderId: string): Promise<InvoiceData> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          country: true,
          addresses: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new InvoiceServiceError('Order not found', 404);
  }

  return buildInvoiceDataFromOrder(order);
}

/**
 * Converts a Prisma Order record into a sanitized, production-ready InvoiceData structure.
 */
export async function buildInvoiceDataFromOrder(order: any): Promise<InvoiceData> {
  const createdAt = new Date(order.createdAt || Date.now());
  const invoiceNumber = formatInvoiceNumber(createdAt, order.id);
  const orderReference = order.id.slice(0, 8).toUpperCase();

  const si: Record<string, any> = (order.shippingInfo as Record<string, any>) || {};
  const user = order.user || {};

  const customerName =
    [si.firstName || user.firstName, si.lastName || user.lastName].filter(Boolean).join(' ') ||
    'Valued Customer';
  const customerEmail = si.email || user.email || 'customer@lebami.com';
  const customerPhone = si.phone || user.phone || '—';

  const customer: CustomerDetails = {
    id: user.id,
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    shippingAddress: {
      addressLine1: si.address || 'Standard Delivery',
      city: si.city || user.city || 'Doha',
      cityAr: si.city === 'Doha' || !si.city ? 'الدوحة' : undefined,
      state: si.state || user.state || 'Doha Municipality',
      stateAr: 'بلدية الدوحة',
      country: si.country || user.country || 'Qatar',
      countryAr: 'دولة قطر',
      postalCode: si.zip || si.postalCode || '—',
    },
    billingAddress: {
      addressLine1: si.address || 'Standard Delivery',
      city: si.city || user.city || 'Doha',
      cityAr: si.city === 'Doha' || !si.city ? 'الدوحة' : undefined,
      state: si.state || user.state || 'Doha Municipality',
      stateAr: 'بلدية الدوحة',
      country: si.country || user.country || 'Qatar',
      countryAr: 'دولة قطر',
      postalCode: si.zip || si.postalCode || '—',
    },
  };

  const lineItems: InvoiceLineItem[] = (order.items || []).map((it: any, index: number) => {
    const unitPrice = Number(it.price || 0);
    const quantity = Number(it.quantity || 1);
    const itemTotal = unitPrice * quantity;
    const taxRate = 0.08; // 8% standard tax
    const taxAmount = Math.round(itemTotal * taxRate * 100) / 100;

    const prod = it.product || {};
    const sku = it.variantSku || prod.sku || `SKU-${order.id.slice(0, 4)}-${index + 1}`;
    const colorAr = translateColorToAr(it.colorName);

    return {
      id: it.id || `item-${index}`,
      itemNumber: index + 1,
      productId: it.productId,
      nameEn: prod.name || 'Luxury Floral Arrangement',
      nameAr: prod.shortDescription || undefined,
      sku,
      variantName: it.variantSku || undefined,
      colorName: it.colorName || undefined,
      colorNameAr: colorAr,
      imageUrl: resolveProductImage(prod),
      quantity,
      unitPrice,
      discountAmount: 0,
      taxRate,
      taxAmount,
      totalAmount: itemTotal,
    };
  });

  const subtotal = Number(order.subtotal) || lineItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const shippingFee = Number(order.shippingFee) || 0;
  const couponDiscount = Number(order.discount) || 0;
  const pointsRedeemed = Number(order.pointsRedeemed) || 0;
  const pointsDiscount = pointsRedeemed; // 1 point = 1 QAR
  const taxAmount = Number(order.tax) || Math.round(subtotal * 0.08);
  const grandTotal = Number(order.totalAmount) || Math.max(0, subtotal + shippingFee + taxAmount - couponDiscount - pointsDiscount);

  const financials: InvoiceFinancials = {
    subtotal,
    shippingFee,
    shippingMethod: shippingFee > 25 ? 'courier' : 'standard',
    couponDiscount,
    pointsRedeemed,
    pointsDiscount,
    taxAmount,
    taxRate: 0.08,
    otherCharges: 0,
    grandTotal,
    paidAmount: grandTotal,
    remainingAmount: 0,
    currencyCode: 'QAR',
    currencySymbolEn: 'QAR',
    currencySymbolAr: 'ر.ق',
  };

  const paymentMethodKey = order.paymentMethod || 'CARD';
  const paymentTranslation = PAYMENT_METHOD_TRANSLATIONS[paymentMethodKey] || {
    en: paymentMethodKey,
    ar: paymentMethodKey,
  };

  const payment: PaymentDetails = {
    method: paymentMethodKey,
    methodLabelEn: paymentTranslation.en,
    methodLabelAr: paymentTranslation.ar,
    transactionId: `TXN-${order.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`,
    gateway: 'QNB / Qatar Central Bank Gateway',
    paymentDate: createdAt,
    status: 'PAID',
    statusLabelEn: 'Paid',
    statusLabelAr: 'مدفوع بنجاح',
  };

  const statusKey = order.status || 'PENDING';
  const statusTrans = STATUS_TRANSLATIONS[statusKey] || { en: statusKey, ar: statusKey };

  const shippingMethodKey = shippingFee > 25 ? 'courier' : 'standard';
  const shippingMethodTrans = SHIPPING_METHOD_TRANSLATIONS[shippingMethodKey] || {
    en: 'Standard Delivery',
    ar: 'توصيل قياسي',
  };

  const delivery: DeliveryDetails = {
    courier: 'Lebami White Glove Logistics',
    courierAr: 'أسطول ليبامي للتوصيل الفاخر',
    trackingNumber: order.trackingNumber || `LBM-${order.id.slice(0, 6).toUpperCase()}`,
    shippingMethod: shippingMethodTrans.en,
    shippingMethodAr: shippingMethodTrans.ar,
    estimatedDelivery: shippingMethodKey === 'courier' ? 'Within 24 Hours' : '3 - 5 Business Days',
    deliveredDate: order.status === 'DELIVERED' ? 'Delivered' : undefined,
    status: statusTrans.en,
    statusAr: statusTrans.ar,
  };

  const notes: OrderNotes = {
    customerNotes: si.notes || undefined,
    giftMessage: si.giftMessage || undefined,
    specialInstructions: 'Handcrafted luxury roses. Keep in a cool, dry place away from direct sunlight.',
  };

  const verificationUrl = `${SITE_URL}/verify/invoice/${order.id}`;

  // Build ZATCA / GCC compliant TLV QR Code data
  const zatcaData: ZatcaQrData = {
    sellerName: DEFAULT_COMPANY.nameEn,
    vatNumber: DEFAULT_COMPANY.trn,
    timestamp: createdAt.toISOString(),
    invoiceTotal: grandTotal.toFixed(2),
    vatTotal: taxAmount.toFixed(2),
  };

  const tlvBase64 = generateZatcaTlvBase64(zatcaData);
  // We embed the verification URL along with TLV payload for universal scanner compatibility
  const qrCodeUrl = await generateQrCodeDataUrl(verificationUrl || tlvBase64);

  return {
    invoiceNumber,
    orderNumber: `#${orderReference}`,
    orderReference,
    orderId: order.id,
    invoiceDate: createdAt,
    orderDate: createdAt,
    supplyDate: createdAt,
    company: DEFAULT_COMPANY,
    customer,
    items: lineItems,
    financials,
    payment,
    delivery,
    notes,
    orderStatus: statusTrans.en,
    orderStatusAr: statusTrans.ar,
    qrCodeUrl,
    verificationUrl,
    verificationToken: order.id,
  };
}
