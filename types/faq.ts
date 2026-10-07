export type FAQCategory =
  | 'General'
  | 'Orders'
  | 'Products'
  | 'Delivery'
  | 'Payment'
  | 'Returns & Refunds'
  | 'Customer Support'
  | 'Subscription';

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

