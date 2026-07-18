import type { FAQCategory, FAQCategoryMeta, FAQItem, MembershipPlan } from '@/types/faq';

/** Category order used for navigation and section rendering. */
export const FAQ_CATEGORIES: FAQCategory[] = [
  'General Orders',
  'Subscription Membership',
  'Products',
  'Delivery',
  'Payments',
  'Changes, Returns & Refunds',
  'Customer Support',
];

/** Short, elegant section descriptions (UI copy — the FAQ answers below are verbatim). */
export const FAQ_CATEGORY_META: FAQCategoryMeta[] = [
  { category: 'General Orders', description: 'Placing, scheduling, and getting your order on its way.' },
  { category: 'Subscription Membership', description: 'Exclusive plans, reward points, and member benefits.' },
  { category: 'Products', description: 'Our flowers, personalisation, and finishing touches.' },
  { category: 'Delivery', description: 'Coverage, tracking, and the delivery experience across Qatar.' },
  { category: 'Payments', description: 'Accepted methods and secure checkout.' },
  { category: 'Changes, Returns & Refunds', description: 'Adjusting an order and resolving any issue.' },
  { category: 'Customer Support', description: 'How and when to reach our team.' },
];

/**
 * All FAQ content — verbatim as provided. Do not paraphrase or edit the copy here.
 * `id` matches the source numbering (1–23) and drives the on-card "01–23" numbering.
 */
export const FAQS: FAQItem[] = [
  {
    id: 1,
    category: 'General Orders',
    question: 'How do I place an order?',
    answer: 'Browse our products, add your favorite items to the cart, enter the delivery details, and complete your payment.',
  },
  {
    id: 2,
    category: 'General Orders',
    question: 'Can I schedule a delivery for a future date?',
    answer: 'Yes. You can select your preferred delivery date and time during checkout.',
  },
  {
    id: 3,
    category: 'General Orders',
    question: 'Do you offer same-day delivery?',
    answer: 'Yes. Same-day delivery is available for eligible locations and orders placed before the daily cut-off time.',
  },
  {
    id: 4,
    category: 'Subscription Membership',
    question: 'What is the Subscription Membership?',
    answer: 'Our Subscription Membership allows customers to enjoy exclusive benefits by choosing one of our membership plans.',
  },
  {
    id: 5,
    category: 'Subscription Membership',
    question: 'What membership plans are available?',
    answer: 'We offer three membership plans:\n\nBasic – QAR\n\nPremium – QAR\n\nVIP – QAR',
  },
  {
    id: 6,
    category: 'Subscription Membership',
    question: 'What benefits do members receive?',
    answer: 'Members receive extra points immediately after successful payment',
  },
  {
    id: 7,
    category: 'Subscription Membership',
    question: 'When are reward points credited?',
    answer: 'Reward points are added to your account automatically once your subscription payment is successfully completed.',
  },
  {
    id: 8,
    category: 'Subscription Membership',
    question: 'Can I use my reward points immediately?',
    answer: 'Yes. Reward points can be redeemed according to our rewards program terms and conditions.',
  },
  {
    id: 9,
    category: 'Subscription Membership',
    question: 'How long is the subscription valid?',
    answer: 'Your membership remains active for the selected subscription period monthly',
  },
  {
    id: 10,
    category: 'Subscription Membership',
    question: 'Can I upgrade my subscription?',
    answer: 'Yes. You can upgrade your membership at any time by paying the difference or purchasing a higher plan.',
  },
  {
    id: 11,
    category: 'Subscription Membership',
    question: 'Can I cancel my subscription?',
    answer: 'Yes. You can cancel auto-renewal at any time. Any benefits already used may be subject to our membership terms.',
  },
  {
    id: 12,
    category: 'Products',
    question: 'Will the flowers look exactly like the pictures?',
    answer: 'We make every effort to match the product images. If certain flowers are unavailable due to seasonal availability, suitable substitutions of equal or greater value may be used.',
  },
  {
    id: 13,
    category: 'Products',
    question: 'Can I add a personalized message?',
    answer: 'Yes. You can include a complimentary message card with your order.',
  },
  {
    id: 14,
    category: 'Products',
    question: 'Do you offer gift wrapping?',
    answer: 'Yes. Gift wrapping is available for selected products.',
  },
  {
    id: 15,
    category: 'Delivery',
    question: 'Which areas do you deliver to?',
    answer: 'We deliver across Qatar, subject to service availability.',
  },
  {
    id: 16,
    category: 'Delivery',
    question: 'Can I track my order?',
    answer: 'Yes. You will receive order status updates via SMS, WhatsApp, or email.',
  },
  {
    id: 17,
    category: 'Delivery',
    question: 'What happens if the recipient is unavailable?',
    answer: 'Our delivery team will contact the recipient or sender to arrange a suitable delivery.',
  },
  {
    id: 18,
    category: 'Payments',
    question: 'Which payment methods do you accept?',
    answer: 'We accept debit cards, credit cards, Apple Pay, Google Pay, and other secure online payment methods.',
  },
  {
    id: 19,
    category: 'Payments',
    question: 'Is online payment secure?',
    answer: 'Yes. All transactions are processed through secure and encrypted payment gateways.',
  },
  {
    id: 20,
    category: 'Changes, Returns & Refunds',
    question: 'Can I modify or cancel my order?',
    answer: 'Yes, provided the order has not yet been prepared or dispatched.',
  },
  {
    id: 21,
    category: 'Changes, Returns & Refunds',
    question: 'What if my order arrives damaged or incorrect?',
    answer: 'Please contact our customer support within 24 hours with photos of the product. We will review the issue and provide an appropriate resolution.',
  },
  {
    id: 22,
    category: 'Customer Support',
    question: 'How can I contact customer support?',
    answer: 'You can reach us via WhatsApp, phone, email, or the Contact Us page.',
  },
  {
    id: 23,
    category: 'Customer Support',
    question: 'What are your customer support hours?',
    answer: 'Our support team is available during business hours to assist you with orders, subscriptions, and general inquiries.',
  },
];

/**
 * Membership showcase tiers. Prices are blank in the source copy — fill the `price`
 * (QAR amount) for each plan to reveal the price row on the cards.
 */
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  { name: 'Basic', price: '', points: 'Earn reward points on every payment', validity: 'Monthly', accent: '#8A9099' },
  { name: 'Premium', price: '', points: 'Earn reward points on every payment', validity: 'Monthly', accent: '#C9A227', featured: true },
  { name: 'VIP', price: '', points: 'Earn reward points on every payment', validity: 'Monthly', accent: '#5B6B7B' },
];

/**
 * Contact targets for the "Still Need Help?" CTA. Defaults to the existing /contact page.
 * Replace with real links when available, e.g.
 *   whatsapp: 'https://wa.me/974XXXXXXXX'
 *   phone:    'tel:+974XXXXXXXX'
 *   email:    'mailto:support@lebami.com'
 */
export const FAQ_CONTACT = {
  whatsapp: '/contact',
  phone: '/contact',
  email: '/contact',
};
