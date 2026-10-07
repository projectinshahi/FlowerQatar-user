
export interface CompanyDetails {
  nameEn: string;
  nameAr: string;
  legalNameEn?: string;
  legalNameAr?: string;
  logoUrl?: string;
  trn: string; // Tax Registration Number (VAT)
  crNumber?: string; // Commercial Registration Number
  phone: string;
  email: string;
  website: string;
  addressEn: string;
  addressAr: string;
  cityEn: string;
  cityAr: string;
  countryEn: string;
  countryAr: string;
  postalCode?: string;
}

export interface CustomerDetails {
  id?: string;
  name: string;
  nameAr?: string;
  email: string;
  phone?: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    cityAr?: string;
    state?: string;
    stateAr?: string;
    country: string;
    countryAr?: string;
    postalCode?: string;
  };
  billingAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    cityAr?: string;
    state?: string;
    stateAr?: string;
    country: string;
    countryAr?: string;
    postalCode?: string;
  };
}

export interface InvoiceLineItem {
  id: string;
  itemNumber: number;
  productId: string;
  nameEn: string;
  nameAr?: string;
  sku?: string;
  variantName?: string;
  variantNameAr?: string;
  colorName?: string;
  colorNameAr?: string;
  size?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number; // e.g. 0.08 for 8%
  taxAmount: number;
  totalAmount: number; // (unitPrice * quantity) - discountAmount + taxAmount
}

export interface InvoiceFinancials {
  subtotal: number; // Sum of line items excl tax & discounts
  shippingFee: number;
  shippingMethod: 'standard' | 'courier' | string;
  couponCode?: string | null;
  couponDiscount: number;
  pointsRedeemed: number;
  pointsDiscount: number;
  taxAmount: number;
  taxRate: number;
  otherCharges: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  currencyCode: string; // 'QAR'
  currencySymbolEn: string; // 'QAR'
  currencySymbolAr: string; // 'ر.ق'
}

export interface PaymentDetails {
  method: 'CARD' | 'POINTS' | 'MIXED' | 'CASH' | string;
  methodLabelEn: string;
  methodLabelAr: string;
  transactionId?: string;
  gateway?: string;
  paymentDate?: string | Date;
  status: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED' | string;
  statusLabelEn: string;
  statusLabelAr: string;
  cardLast4?: string;
}

export interface DeliveryDetails {
  courier: string;
  courierAr?: string;
  trackingNumber?: string;
  shippingMethod: string;
  shippingMethodAr?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  status: string;
  statusAr?: string;
}

export interface OrderNotes {
  customerNotes?: string;
  giftMessage?: string;
  adminNotes?: string;
  specialInstructions?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  orderReference: string;
  orderId: string;
  invoiceDate: string | Date;
  orderDate: string | Date;
  supplyDate?: string | Date;
  company: CompanyDetails;
  customer: CustomerDetails;
  items: InvoiceLineItem[];
  financials: InvoiceFinancials;
  payment: PaymentDetails;
  delivery: DeliveryDetails;
  notes: OrderNotes;
  orderStatus: string;
  orderStatusAr: string;
  qrCodeUrl?: string;
  verificationUrl?: string;
  verificationToken?: string;
}
