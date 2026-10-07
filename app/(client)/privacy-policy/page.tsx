import Breadcrumbs from '@/components/Breadcrumbs';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description:
    'How LEBAMI collects, uses and protects your personal information when you visit our website, place an order or use our services.',
  path: '/privacy-policy',
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm uppercase tracking-wider font-semibold text-primary">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 pb-8 page-below-header font-sans text-primary">
      <Breadcrumbs items={[{ label: 'Privacy Policy', href: '/privacy-policy' }]} />

      <h1 className="font-serif text-3xl md:text-4xl text-primary tracking-wide mt-2 mb-4">Privacy Policy</h1>
      <p className="text-xs md:text-sm text-muted mb-10">
        Last Updated: <time dateTime="2026-10-07">7 October 2026</time>
      </p>

      <div className="space-y-8 text-xs md:text-sm text-muted leading-relaxed">
        <div className="space-y-3">
          <p>At LEBAMI, we respect your privacy and are committed to protecting your personal information.</p>
          <p>
            This Privacy Policy explains what information we collect and how we use it when you visit our website,
            place an order, or use our services.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <p>When you place an order or contact us, we may collect:</p>
          <List
            items={[
              'Name',
              'Phone number',
              'Email address',
              'Delivery address',
              "Recipient's name and phone number",
              'Order details',
              'Gift messages or delivery instructions',
              'Subscription details',
              'Information provided for returns, refunds, or damaged products',
            ]}
          />
          <p>We may also collect basic information about how you use our website, such as cookies and website activity.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your information to:</p>
          <List
            items={[
              'Process and confirm your orders',
              'Arrange delivery',
              'Process payments',
              'Manage subscriptions',
              'Contact you about your order',
              'Handle returns, replacements, and refunds',
              'Provide customer support',
              'Improve our website and services',
              'Send offers and promotions, where applicable',
            ]}
          />
        </Section>

        <Section title="3. Payment Information">
          <p>Payments may be processed through secure third-party payment providers.</p>
          <p>
            LEBAMI does not intentionally store complete card or banking information unless required by our payment
            system and permitted by applicable law.
          </p>
        </Section>

        <Section title="4. Sharing Your Information">
          <p>We do not sell your personal information.</p>
          <p>We may share necessary information with trusted service providers, such as:</p>
          <List
            items={[
              'Payment providers',
              'Delivery partners',
              'Website and hosting providers',
              'IT service providers',
              'Other service providers required to complete your order',
            ]}
          />
          <p>We may also provide information when required by law.</p>
        </Section>

        <Section title="5. Protecting Your Information">
          <p>
            We take reasonable steps to protect your personal information from unauthorized access, misuse, loss, or
            disclosure.
          </p>
          <p>However, no online system can be guaranteed to be completely secure.</p>
        </Section>

        <Section title="6. Cookies">
          <p>
            Our website may use cookies to improve your browsing experience, remember preferences, understand website
            usage, and improve our services.
          </p>
          <p>You can manage cookies through your browser settings.</p>
        </Section>

        <Section title="7. Marketing">
          <p>
            We may send you information about new products, special offers, promotions, and subscription services
            where permitted.
          </p>
          <p>You can choose to stop receiving marketing messages at any time.</p>
        </Section>

        <Section title="8. Your Information">
          <p>If you would like to update, correct, or ask about your personal information, please contact us.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            LEBAMI may update this Privacy Policy from time to time. Any updates will be posted on this page with the
            latest update date.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>If you have any questions about this Privacy Policy or your personal information, please contact us:</p>
          <address className="not-italic space-y-1.5">
            <p className="font-semibold text-primary">LEBAMI</p>
            <p>
              Email:{' '}
              <a href="mailto:admin@lebami.com" className="text-primary underline underline-offset-2 hover:text-secondary">
                admin@lebami.com
              </a>
            </p>
            <p>
              Phone:{' '}
              <a href="tel:+97430893087" className="text-primary underline underline-offset-2 hover:text-secondary">
                <span dir="ltr">+974 3089 3087</span>
              </a>
            </p>
            <p>Address: Qatar</p>
          </address>
        </Section>

        <p className="font-serif text-base text-primary">Thank you for trusting LEBAMI.</p>
      </div>
    </div>
  );
}
