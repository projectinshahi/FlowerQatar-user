'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Mail, LifeBuoy } from 'lucide-react';
import { FAQ_CONTACT } from '@/data/faq';

const BUTTONS = [
  { label: 'WhatsApp', href: FAQ_CONTACT.whatsapp, Icon: MessageCircle },
  { label: 'Call Us', href: FAQ_CONTACT.phone, Icon: Phone },
  { label: 'Email Support', href: FAQ_CONTACT.email, Icon: Mail },
];

/** Elegant "Still Need Help?" closing CTA. */
export default function FAQBottomCTA() {
  const isExternal = (href: string) => /^(https?:|tel:|mailto:)/.test(href);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="faq-help-heading"
      className="relative overflow-hidden rounded-[32px] border border-divider/60 bg-cream px-6 py-14 text-center md:px-12"
    >
      <span aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
        <LifeBuoy size={24} strokeWidth={1.4} />
      </div>

      <h2 id="faq-help-heading" className="relative mt-6 font-serif text-[30px] font-light text-primary md:text-[38px]">
        Still Need Help?
      </h2>
      <p className="relative mx-auto mt-3 max-w-xl font-sans text-[14px] leading-relaxed text-muted md:text-[15px]">
        Our support team is always ready to assist you with orders, memberships, delivery and product inquiries.
      </p>

      <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {BUTTONS.map(({ label, href, Icon }, i) => {
          const primary = i === 0;
          const cls = primary
            ? 'text-white shadow-[0_10px_26px_-8px_rgba(97,0,11,0.5)] hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-8px_rgba(97,0,11,0.6)]'
            : 'border border-primary/25 text-primary hover:-translate-y-0.5 hover:border-primary/45 hover:bg-white';
          const content = (
            <>
              <Icon size={16} />
              {label}
            </>
          );
          const className = `inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3 font-sans text-[12px] font-medium uppercase tracking-[0.15em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-auto ${cls}`;
          const style = primary ? { backgroundImage: 'linear-gradient(135deg, #61000B 0%, #941A2F 60%, #C45878 100%)' } : undefined;

          return isExternal(href) ? (
            <a key={label} href={href} className={className} style={style}>{content}</a>
          ) : (
            <Link key={label} href={href} className={className} style={style}>{content}</Link>
          );
        })}
      </div>
    </motion.section>
  );
}
