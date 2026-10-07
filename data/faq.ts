import type { FAQCategory, FAQCategoryMeta, FAQItem } from '@/types/faq';

/** Category order used for navigation and section rendering. */
export const FAQ_CATEGORIES: FAQCategory[] = [
  'General',
  'Orders',
  'Products',
  'Delivery',
  'Payment',
  'Returns & Refunds',
  'Customer Support',
  'Subscription',
];

/** Short section descriptions (UI copy — the FAQ answers below are the client's wording). */
export const FAQ_CATEGORY_META: FAQCategoryMeta[] = [
  { category: 'General', description: 'Who we are and what we offer.' },
  { category: 'Orders', description: 'Placing, personalising, and changing your order.' },
  { category: 'Products', description: 'Our flowers, their natural character, and corporate services.' },
  { category: 'Delivery', description: 'Coverage, timing, and the delivery experience across Qatar.' },
  { category: 'Payment', description: 'How and when payment is made.' },
  { category: 'Returns & Refunds', description: 'Damaged, incorrect, or unexpected orders, resolved.' },
  { category: 'Customer Support', description: 'How to reach our team and what we can help with.' },
  { category: 'Subscription', description: 'Regular flower deliveries on a plan that suits you.' },
];

/**
 * All FAQ content, as provided by the client. `id` runs 1–31 in display order and drives the
 * on-card "01–31" numbering.
 */
export const FAQS: FAQItem[] = [
  // 1. General
  {
    id: 1,
    category: 'General',
    question: 'What is LEBAMI?',
    answer: 'LEBAMI is a flower, chocolate and plant e-commerce brand offering fresh flowers, bouquets, floral arrangements, plants, gifts, and specially curated arrangements for different occasions.',
  },
  {
    id: 2,
    category: 'General',
    question: 'What occasions can I order flowers for?',
    answer: 'You can order flowers for birthdays, anniversaries, weddings, congratulations, new baby celebrations, corporate occasions, and many other special moments.',
  },
  {
    id: 3,
    category: 'General',
    question: 'Are LEBAMI flowers fresh?',
    answer: 'Yes. We source fresh flowers directly from trusted growers and suppliers in the Netherlands, Ecuador, and Kenya on a weekly basis, ensuring high-quality, fresh, and beautifully presented flowers.',
  },
  {
    id: 4,
    category: 'General',
    question: 'Can I order plants online?',
    answer: 'Yes. Selected plants are available through the LEBAMI online store, subject to availability.',
  },

  // 2. Orders
  {
    id: 5,
    category: 'Orders',
    question: 'Can I order flowers online?',
    answer: 'Yes. You can browse our collection, choose your preferred arrangement, and place your order directly through our website.',
  },
  {
    id: 6,
    category: 'Orders',
    question: 'Can I send flowers as a gift?',
    answer: 'Absolutely. You can send flowers and gifts directly to your loved ones with a personalized message.',
  },
  {
    id: 7,
    category: 'Orders',
    question: 'Can I add a personal message to my order?',
    answer: 'Yes. You can include a special message with your order and choose customized items to make your gift more personal and meaningful.',
  },
  {
    id: 8,
    category: 'Orders',
    question: 'Can I change or cancel my order?',
    answer: 'Order changes or cancellations may be possible depending on the status of your order. Please contact us within 30 minutes of placing your order to request any changes or cancellation.',
  },
  {
    id: 9,
    category: 'Orders',
    question: 'Can I request a customized bouquet?',
    answer: 'Yes. For special requests or customized arrangements, please contact our team and we will be happy to discuss your requirements.',
  },

  // 3. Products
  {
    id: 10,
    category: 'Products',
    question: 'Will my bouquet look exactly like the picture?',
    answer: 'We aim to match the product shown on our website as closely as possible. Since flowers are natural products, slight differences in colour, size, shape, and availability may occur.',
  },
  {
    id: 11,
    category: 'Products',
    question: 'How long do fresh flowers last?',
    answer: 'The lifespan of flowers depends on the type of flowers and how they are cared for. We provide basic care guidance to help you keep your flowers fresh for longer.',
  },
  {
    id: 12,
    category: 'Products',
    question: 'Are natural differences in flowers considered damage?',
    answer: 'No. As flowers and plants are natural products, slight differences in colour, size, shape, and arrangement may occur. These natural variations are not considered defects.',
  },
  {
    id: 13,
    category: 'Products',
    question: 'Do you provide corporate flower services?',
    answer: 'Yes. LEBAMI provides flowers and floral arrangements for offices, hotels, events, corporate gifting, and special occasions.',
  },

  // 4. Delivery
  {
    id: 14,
    category: 'Delivery',
    question: 'Where does LEBAMI deliver?',
    answer: 'We provide flower and gift delivery across Qatar. Delivery availability may depend on the product and location.',
  },
  {
    id: 15,
    category: 'Delivery',
    question: 'Can I choose my delivery date?',
    answer: 'Yes. During checkout, you can select your preferred delivery date.',
  },
  {
    id: 16,
    category: 'Delivery',
    question: 'Is same-day delivery available?',
    answer: 'Same-day delivery may be available for selected products and locations. Please check the available delivery options during checkout.',
  },
  {
    id: 17,
    category: 'Delivery',
    question: 'What if the recipient is not available?',
    answer: 'Our delivery team will contact the recipient or customer to arrange the best possible delivery option.',
  },

  // 5. Payment
  {
    id: 18,
    category: 'Payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept the payment methods available on the LEBAMI website at the time of checkout.',
  },
  {
    id: 19,
    category: 'Payment',
    question: 'When do I need to make the payment?',
    answer: 'Payment is completed during the online checkout process using the available payment options.',
  },

  // 6. Returns & Refunds
  {
    id: 20,
    category: 'Returns & Refunds',
    question: 'What if my flowers or product arrive damaged?',
    answer: 'If your order arrives damaged, wilted, broken, or with any significant issue, please contact us within 5 to 7 minutes of delivery and share your order number along with clear photos or videos of the product.',
  },
  {
    id: 21,
    category: 'Returns & Refunds',
    question: 'Can I get a replacement if my order is damaged?',
    answer: 'Yes. If the product is damaged during delivery or there is an error with your order, LEBAMI can arrange a replacement or a new order, subject to product availability.',
  },
  {
    id: 22,
    category: 'Returns & Refunds',
    question: 'Can I request a refund?',
    answer: 'Yes. If a replacement is not available or there is a valid issue with your order, you may request a refund for the affected product. Our team will review the request and provide the appropriate solution.',
  },
  {
    id: 23,
    category: 'Returns & Refunds',
    question: 'What if I receive the wrong product?',
    answer: 'Please contact LEBAMI as soon as possible. We will review the issue and arrange a replacement or refund where applicable.',
  },
  {
    id: 24,
    category: 'Returns & Refunds',
    question: 'How long do I have to report a damaged order?',
    answer: 'Please contact LEBAMI within 5–7 minutes of delivery and provide clear photos or videos of the issue, along with your order number, so our team can assist you quickly.',
  },

  // 7. Customer Support
  {
    id: 25,
    category: 'Customer Support',
    question: 'How can I contact LEBAMI?',
    answer: 'You can contact our customer support team through the contact details provided on our website. We are happy to assist you with orders, delivery, customization, and other questions.',
  },
  {
    id: 26,
    category: 'Customer Support',
    question: 'What can LEBAMI customer support help me with?',
    answer: 'Our team can assist with orders, delivery, product customization, damaged or incorrect orders, returns, refunds, and other questions.',
  },
  {
    id: 27,
    category: 'Customer Support',
    question: 'What should I provide when contacting support about a damaged order?',
    answer: 'Please provide your order number and clear photos or videos showing the issue. This helps our team review and resolve the matter quickly.',
  },

  // 8. Subscription
  {
    id: 28,
    category: 'Subscription',
    question: 'What is the LEBAMI Flower Subscription?',
    answer: 'LEBAMI Flower Subscription allows you to receive fresh flowers or selected arrangements regularly according to your preferred subscription plan.',
  },
  {
    id: 29,
    category: 'Subscription',
    question: 'How does the flower subscription work?',
    answer: 'Choose your preferred subscription plan, select the delivery frequency, provide your delivery details, and enjoy regular flower deliveries from LEBAMI.',
  },
  {
    id: 30,
    category: 'Subscription',
    question: 'Can I pause or cancel my subscription?',
    answer: 'Yes, subscription changes, pauses, or cancellations may be possible depending on your subscription plan and its terms. Please contact our support team for assistance.',
  },
  {
    id: 31,
    category: 'Subscription',
    question: 'Can I change my subscription plan?',
    answer: 'Yes. You can contact our team to discuss changing your subscription plan, subject to availability and the applicable plan terms.',
  },
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
