
import React from 'react';
import Breadcrumbs from '../../../components/Breadcrumbs';

export default function ShippingReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 pb-8 page-below-header font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Shipping & Returns', href: '/shipping-returns' }]} />

      <h1 className="font-serif text-3xl md:text-4xl text-primary mb-10 tracking-wide mt-2">
        Shipping & Returns Policy
      </h1>

      <div className="space-y-8 text-xs md:text-sm text-muted leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider font-semibold text-primary">
            1. Insured Shipping Speeds
          </h2>
          <p>
            Lebami offers secure shipping worldwide. Standard shipping is complimentary for orders exceeding QAR 150. For smaller items, a flat QAR 15 logistics fee is added. 
          </p>
          <div className="border border-divider bg-cream/40 p-4 overflow-x-auto rounded-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-divider font-semibold text-primary">
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/40">
                <tr className="text-muted/80">
                  <td className="py-2.5 font-medium text-primary">Standard Insured</td>
                  <td className="py-2.5">3 - 5 Business Days</td>
                  <td className="py-2.5">Free (QAR 15 if under QAR 150)</td>
                </tr>
                <tr className="text-muted/80">
                  <td className="py-2.5 font-medium text-primary">Expedited Priority</td>
                  <td className="py-2.5">1 - 2 Business Days</td>
                  <td className="py-2.5">QAR 25 flat fee</td>
                </tr>
                <tr className="text-muted/80">
                  <td className="py-2.5 font-medium text-primary">White Glove Courier</td>
                  <td className="py-2.5">Next Day by 6:00 PM</td>
                  <td className="py-2.5">+QAR 35 premium</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider font-semibold text-primary">
            2. White Glove Delivery
          </h2>
          <p>
            We offer specialized local courier dispatch in NYC, London, and LA. Since preserved roses are sensitive to climate and humilities, temperature-monitored courier vans ensure they arrive fully bloomed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider font-semibold text-primary">
            3. Return & Refund Guidelines
          </h2>
          <p>
            Please note that all Lebami preserved arrangements are final sale. Because each box is custom handcrafted with natural preserved vegetation, they cannot be returned or restocked once assembled.
          </p>
          <p>
            In the rare event that your shipment arrives damaged during transit, contact our Customer Care concierge within 48 hours of receipt at <span className="font-semibold text-primary">concierge@venusetfleur-clone.com</span> with details and photographs. We will happily dispatch a replacement.
          </p>
        </section>
      </div>
    </div>
  );
}
