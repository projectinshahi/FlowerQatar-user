'use client';

import React, { useState } from 'react';
import { ChevronRight, PackageSearch, Loader2 } from 'lucide-react';
import Breadcrumbs from '../../../components/Breadcrumbs';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  /**
   * Records the enquiry. The message goes to the admin inbox at /admin/contact-enquiries and
   * nowhere else — no WhatsApp hand-off, so the customer stays on the site and the enquiry is
   * saved exactly once.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message || sending) return;

    setSending(true);
    setError(null);
    setSubmitted(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not send your message');

      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const quickLinks = [
    'Where\'s My Order?',
    'Modify Shipping Address',
    'Cancel My Order',
    'Report Damages',
    'Shipping Cutoff Times',
    'Returns and Exchanges'
  ];

  return (
    <div className="max-w-[800px] mx-auto px-4 md:px-8 py-12 md:py-16 text-secondary min-h-screen">
      {/* Breadcrumbs */}
      <div className="mb-10 font-sans">
        <Breadcrumbs items={[{ label: 'Contact us', href: '/contact' }]} />
      </div>

      {/* Quick Links Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {quickLinks.map((link, idx) => (
          <button 
            key={idx} 
            className="flex items-center justify-between border border-secondary/20 p-5 rounded-sm hover:border-secondary transition-colors bg-white/50"
          >
            <span className="font-serif font-medium text-[15px]">{link}</span>
            <ChevronRight size={18} className="text-secondary/40" />
          </button>
        ))}
      </div> */}

      {/* Track Order Section */}
      {/* <div className="border border-secondary/20 p-6 md:p-8 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors mb-12 bg-white/50">
        <PackageSearch size={32} strokeWidth={1.2} className="mb-3 text-secondary" />
        <span className="font-serif font-medium text-[15px]">Track order</span>
      </div> */}
      <br />

      {/* Contact Form Section */}
      <div className="border border-secondary/20 rounded-sm p-6 md:p-10 bg-white/50">
        <h1 className="text-3xl md:text-4xl font-serif mb-8 border-b border-secondary/20 pb-6">Contact us</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-sans">
          
          <div className="flex flex-col gap-2">
            <label htmlFor="contact-name" className="text-[13px] text-secondary">
              Full name <span className="text-red-400">*</span>
            </label>
            <input id="contact-name" 
              type="text"
              required
              value={name}
              autoComplete="name" onChange={(e) => setName(e.target.value)}
              className="border border-secondary/20 p-3 md:p-4 rounded-sm focus:outline-none focus:border-secondary transition-colors bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contact-email" className="text-[13px] text-secondary">
              Email <span className="text-red-400">*</span>
            </label>
            <input id="contact-email" 
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              autoComplete="email" inputMode="email" onChange={(e) => setEmail(e.target.value)}
              className="border border-secondary/20 p-3 md:p-4 rounded-sm focus:outline-none focus:border-secondary transition-colors placeholder:text-secondary/30 bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contact-subject" className="text-[13px] text-secondary">
              Subject <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select id="contact-subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-secondary/20 p-3 md:p-4 rounded-sm focus:outline-none focus:border-secondary transition-colors appearance-none bg-transparent"
              >
                <option value="" disabled>Select a subject</option>
                <option value="order_issue">Order Issue</option>
                <option value="product_question">Product Question</option>
                <option value="returns">Returns</option>
                <option value="other">Other</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <ChevronRight size={16} className="text-secondary/50 transform rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contact-message" className="text-[13px] text-secondary">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea id="contact-message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border border-secondary/20 p-3 md:p-4 rounded-sm focus:outline-none focus:border-secondary transition-colors resize-y bg-transparent"
            ></textarea>
          </div>

          {error && (
            <p role="alert" className="text-[12px] text-red-600 border border-red-200 bg-red-50 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          {/* Stays until the next submit — the customer is not redirected anywhere now, so
              this banner is the only confirmation that the message got through. */}
          {submitted && (
            <p
              role="status"
              className="text-[12px] text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-sm px-3 py-3"
            >
              Thank you — your message has been sent. Our team will get back to you by email
              shortly.
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-black text-white font-sans text-[11px] uppercase tracking-[0.2em] py-5 mt-4 hover:bg-black/80 transition-colors rounded-sm font-medium disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {sending && <Loader2 size={14} className="animate-spin" />}
            {sending ? 'SENDING…' : submitted ? 'MESSAGE SENT' : 'SEND MESSAGE'}
          </button>
          
          <p className="text-[11px] text-secondary/60 text-left mt-2">
            This site is protected by reCAPTCHA. For more information, please refer to Gorgias&apos; Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
}
