export type FAQCategory =
  | 'General Orders'
  | 'Subscription Membership'
  | 'Products'
  | 'Delivery'
  | 'Payments'
  | 'Changes, Returns & Refunds'
  | 'Customer Support';

export interface FAQItem {
  id: number;
  category: FAQCategory;
  question: string;
  answer: string;
}

/** Section heading + short description for each category (UI copy, not FAQ content). */
export interface FAQCategoryMeta {
  category: FAQCategory;
  description: string;
}

/** One tier in the membership showcase. `price` is intentionally editable (blank until set). */
export interface MembershipPlan {
  name: 'Basic' | 'Premium' | 'VIP';
  price: string; // QAR amount, e.g. "99" — leave "" to hide the price row
  points: string;
  validity: string;
  accent: string;
  featured?: boolean;
}
